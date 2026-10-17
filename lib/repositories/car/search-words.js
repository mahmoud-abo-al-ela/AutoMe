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
