// The car search's words: how each one the buyer typed matches the cars in
// the search's scope — corrected if misspelt, then judged as filtering,
// ranking or missing — and the SQL the search matches and ranks by.
// searchCarsRanked (search.js) runs it before every search with text.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { logError } from "@/lib/utils/errors";
import { correctableWord, correctedTerm, correctionNames } from "./search-query";
import { findSimilarNames, findSimilarWords } from "./search-terms";
import {
  CORRECTION_SIMILARITY,
  chooseCorrection,
  classifyTerms,
  inverseDocumentFrequency,
} from "@/lib/search/lexical";

/** The cars a search reads, each with its dealership. */
export const FROM = Prisma.sql`FROM "Car" c JOIN "Organization" o ON o."id" = c."organizationId"`;

/**
 * Whether a car has one search term (see SearchTerm in search-query.ts): in its
 * search vector — anywhere by default, or by one of the term's narrower queries
 * — in its dealership's place, or as its model year.
 *
 * A car is in a place because its dealership is. The vector covers the car's own
 * columns, and the only place among them is `location` — free text a dealer
 * typed — so a place term is matched against the dealership's canonical columns
 * too. A year is matched against its column, which the vector does not hold.
 * Both are structured, not prose.
 */
function termMatch(term, query = term.query) {
  const parts = [Prisma.sql`c."searchVector" @@ to_tsquery('simple', ${query})`];
  if (term.places.length > 0) {
    const places = Prisma.join(term.places);
    parts.push(Prisma.sql`o."city" IN (${places}) OR o."region" IN (${places})`);
  }
  if (term.year !== null) parts.push(Prisma.sql`c."year" = ${term.year}`);
  return Prisma.sql`(${Prisma.join(parts, " OR ")})`;
}

/**
 * How many cars in scope there are, and how many have each term — anywhere,
 * in a structured field, and as their make or model.
 */
async function countTerms(where, terms) {
  const counts = terms.flatMap((term, i) => [
    Prisma.sql`count(*) FILTER (WHERE ${termMatch(term)})::int AS ${Prisma.raw(`"df${i}"`)}`,
    Prisma.sql`count(*) FILTER (WHERE ${termMatch(term, term.structuredQuery)})::int AS ${Prisma.raw(`"ds${i}"`)}`,
    Prisma.sql`count(*) FILTER (WHERE c."searchVector" @@ to_tsquery('simple', ${term.nameQuery}))::int AS ${Prisma.raw(`"dn${i}"`)}`,
  ]);
  const [row] = await db.$queryRaw(Prisma.sql`
    SELECT count(*)::int AS n, ${Prisma.join(counts, ", ")}
    ${FROM}
    WHERE ${where}
  `);
  return {
    n: row.n,
    stats: terms.map((_, i) => ({ df: row[`df${i}`], dfStructured: row[`ds${i}`], dfName: row[`dn${i}`] })),
  };
}

/** Nearest known words fetched per typo — more than are ever kept, as some will not be in scope. */
const CANDIDATES_PER_TYPO = 6;

/**
 * Replace each typo — a correctable word no car in scope has — with the known
 * words it was probably meant to be (lib/search/lexical.ts chooses them).
 * Known words come from the listings' vocabulary and from the alias index's
 * names, which hold what no listing says: an Arabic make ("تيوتا" → تويوتا).
 * Both only propose: a candidate counts only if a car in this same scope has
 * it, so a correction never reaches past the tenant, the listing's visibility
 * or the filters. Null when nothing was corrected — and a source that cannot
 * be read costs its corrections, never the search.
 */
async function correctTypos(where, terms, stats) {
  const typos = terms.map((term, i) => (stats[i].df === 0 ? correctableWord(term) : null));
  const tokens = [...new Set(typos.filter(Boolean))];
  if (tokens.length === 0) return null;

  const names = correctionNames();
  const options = { minSimilarity: CORRECTION_SIMILARITY, perToken: CANDIDATES_PER_TYPO };
  const sources = await Promise.allSettled([
    findSimilarWords(tokens, options),
    findSimilarNames(tokens, [...names.keys()], options),
  ]);
  // A known name is shown as written ("أوتوماتيك", not its folded form), and
  // the same word from both sources is one candidate, with the better scores.
  const byWord = new Map();
  for (const source of sources) {
    if (source.status === "rejected") {
      logError("Typo candidates could not be read; searching without them", source.reason);
      continue;
    }
    for (const s of source.value) {
      const word = names.get(s.word) ?? s.word;
      const key = `${s.token}\u0000${word}`;
      const seen = byWord.get(key);
      byWord.set(key, {
        token: s.token,
        word,
        similarity: Math.max(s.similarity, seen?.similarity ?? 0),
        ndoc: Math.max(s.ndoc, seen?.ndoc ?? 0),
      });
    }
  }
  const similar = [...byWord.values()];
  if (similar.length === 0) return null;

  // Each candidate counted as a term of its own: which do cars in scope have?
  const candidates = [...new Set(similar.map((s) => s.word))].flatMap((word) => {
    const term = correctedTerm(word, [word]);
    return term ? [{ word, term }] : [];
  });
  const { stats: candidateStats } = await countTerms(where, candidates.map((c) => c.term));
  const dfOf = new Map(candidates.map((c, i) => [c.word, candidateStats[i].df]));

  const corrected = [];
  const next = terms.map((term, i) => {
    const token = typos[i];
    if (!token) return term;
    const chosen = chooseCorrection(
      token,
      similar.filter((s) => s.token === token).map((s) => ({ ...s, df: dfOf.get(s.word) ?? 0 }))
    );
    const replacement = chosen.length > 0 ? correctedTerm(term.text, chosen) : null;
    if (!replacement) return term;
    corrected.push({ from: term.text, to: chosen });
    return replacement;
  });
  return corrected.length > 0 ? { terms: next, corrected } : null;
}

/**
 * Judge each term against the cars in scope — the results' own conditions, so
 * a word is weighed among the cars this buyer could actually see, in this
 * tenant, under these filters — and decide how the words match
 * (lib/search/lexical.ts says which words filter):
 *
 * - `all`: every filtering term, whenever some car has them all;
 * - `some`: failing that, any of them, the cars with more (and rarer) of them
 *   first;
 * - `none`: nothing to match on — every word missing, or only common words no
 *   car has together, where "any of them" would be most of the catalogue. The
 *   search is then left to its meaning.
 *
 * A typo is corrected before the judging (correctTypos), and the corrected
 * words are then judged like any other. A word that is some car's make or
 * model in scope names cars, and matches a car's own name only — make, model,
 * titles — so "corolla" finds Corollas, not the Kia "better than a Corolla".
 * Any other word, a feature included, also matches descriptions: a sunroof
 * mentioned there is a sunroof. Returns the SQL to match and rank by, the
 * words set aside, and the words corrected.
 */
export async function analyzeTerms(conditions, typed, { correct = true } = {}) {
  if (typed.length === 0) return { tier: "none", missing: [], corrected: [] };

  const where = Prisma.join(conditions, " AND ");
  let terms = typed;
  let { n, stats } = await countTerms(where, terms);
  // Off for "Search instead for …": the words as typed, folded and widened as always.
  const correction = correct ? await correctTypos(where, terms, stats) : null;
  const corrected = correction?.corrected ?? [];
  if (correction) {
    terms = correction.terms;
    ({ n, stats } = await countTerms(where, terms));
  }

  const { roles, onlyCommon } = classifyTerms(n, stats);
  const missing = terms.filter((_, i) => roles[i] === "missing").map((term) => term.text);
  const filtering = terms.filter((_, i) => roles[i] === "filter");
  if (filtering.length === 0) return { tier: "none", missing, corrected };

  const matchOf = (term) => {
    const { dfName } = stats[terms.indexOf(term)];
    return termMatch(term, dfName > 0 ? term.ownQuery : term.query);
  };

  // Every word found ranks — those that only rank included. Normalized by the
  // listing's length (1 + log of its word count), so a long description does
  // not outrank a short one by repeating itself: the length part of BM25.
  // Chosen by test/search-relevance.test.ts over ts_rank_cd and other
  // normalizations, which did no better.
  const found = terms.filter((_, i) => roles[i] !== "missing");
  const rankQuery = found.map((term) => term.query).join(" | ");
  const textRank = Prisma.sql`ts_rank(c."searchVector", to_tsquery('simple', ${rankQuery}), 1)`;
  const all = Prisma.sql`(${Prisma.join(filtering.map(matchOf), " AND ")})`;

  if (filtering.length > 1) {
    const [{ count }] = await db.$queryRaw(Prisma.sql`SELECT count(*)::int AS count ${FROM} WHERE ${where} AND ${all}`);
    if (count === 0) {
      if (onlyCommon) return { tier: "none", missing, corrected };
      const coverage = Prisma.join(
        found.map((term) => {
          const idf = inverseDocumentFrequency(n, stats[terms.indexOf(term)].df);
          return Prisma.sql`CASE WHEN ${matchOf(term)} THEN ${idf}::float8 ELSE 0::float8 END`;
        }),
        " + "
      );
      return {
        tier: "some",
        missing,
        corrected,
        match: Prisma.sql`(${Prisma.join(filtering.map(matchOf), " OR ")})`,
        relevance: [Prisma.sql`(${coverage})`, textRank],
      };
    }
  }
  return { tier: "all", missing, corrected, match: all, relevance: [textRank] };
}
