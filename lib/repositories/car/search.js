// Ranked car search — the search branch of findManyCars (queries.js).
//
// Each word is first judged against the cars in scope (analyzeTerms): required,
// a ranking signal only, or missing. Then the words that filter are matched —
// all of them, or failing that some — and fused with the search's meaning
// (runHybrid) when the listing service supplies it; full text with a trigram
// fallback otherwise. Structured filters below mirror buildCarWhereClause
// (filters.js) — keep the two in sync until that logic is unified.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { serializeCars } from "@/lib/utils/serializers";
import { logError } from "@/lib/utils/errors";
import { searchTerms, toTrigramTerm } from "./search-query";
import { classifyTerms, inverseDocumentFrequency } from "@/lib/search/lexical";
import { VALIDATION_RULES } from "@/lib/constants/validation";
import { toVectorLiteral } from "@/lib/ai/embeddings";
import {
  HYBRID_CANDIDATES,
  RRF_K,
  SEMANTIC_MIN_SIMILARITY,
  SEMANTIC_WITHIN_BEST,
} from "@/lib/search/hybrid";

// Real columns to hydrate (everything except the tsvector, which never leaves
// the DB). Selected explicitly so `SELECT *` can't leak searchVector to clients.
const CAR_COLUMNS = Prisma.sql`
  c."id", c."organizationId", c."make", c."model", c."year", c."price",
  c."mileage", c."fuelType", c."transmission", c."color", c."seats",
  c."bodyType", c."featured", c."status", c."images", c."title",
  c."description", c."titleEn", c."titleAr", c."descriptionEn",
  c."descriptionAr", c."location", c."features", c."featuresAr",
  c."createdAt", c."updatedAt",
  json_build_object(
    'name', o."name", 'logo', o."logo", 'slug', o."slug",
    'city', o."city", 'region', o."region"
  ) AS organization
`;

/** Single value or array → cleaned array, or undefined when empty. */
function normalizeMulti(value) {
  if (value === undefined || value === null) return undefined;
  const arr = Array.isArray(value) ? value : [value];
  const cleaned = arr.filter((v) => v !== undefined && v !== null && v !== "");
  return cleaned.length === 0 ? undefined : cleaned;
}

/** Exact single/multi match on a whitelisted column. */
function matchCondition(column, value) {
  const normalized = normalizeMulti(value);
  if (!normalized) return undefined;
  // column comes from a fixed set of literals below — never user input.
  const col = Prisma.raw(`c."${column}"`);
  return normalized.length === 1
    ? Prisma.sql`${col} = ${normalized[0]}`
    : Prisma.sql`${col} IN (${Prisma.join(normalized)})`;
}

/**
 * Structured (non-text) filter conditions, mirroring buildCarWhereClause.
 * Returns an array of Prisma.Sql fragments to be AND-ed together.
 */
function buildStructuredConditions(filters) {
  const conditions = [];

  // Organization scope (multi-tenancy). Public listings only see active orgs.
  if (filters.organizationId) {
    conditions.push(Prisma.sql`c."organizationId" = ${filters.organizationId}`);
  } else {
    conditions.push(Prisma.sql`o."isActive" = true AND o."deletedAt" IS NULL`);
    if (filters.dealership) {
      conditions.push(Prisma.sql`o."slug" = ${filters.dealership}`);
    }
    if (filters.city) {
      conditions.push(Prisma.sql`lower(o."city") = lower(${filters.city})`);
    }
  }

  // Status (default AVAILABLE for public listings).
  if (filters.status !== undefined) {
    conditions.push(Prisma.sql`c."status" = ${filters.status}::"CarStatus"`);
  } else if (filters.onlyAvailable !== false) {
    conditions.push(Prisma.sql`c."status" = 'AVAILABLE'::"CarStatus"`);
  }

  for (const [column, value] of [
    ["make", filters.make],
    ["bodyType", filters.bodyType],
    ["fuelType", filters.fuelType],
    ["transmission", filters.transmission],
  ]) {
    const condition = matchCondition(column, value);
    if (condition) conditions.push(condition);
  }

  if (filters.color && filters.color.trim() !== "") {
    conditions.push(Prisma.sql`c."color" ILIKE ${`%${filters.color.trim()}%`}`);
  }
  if (filters.minSeats !== undefined && filters.minSeats !== null) {
    conditions.push(Prisma.sql`c."seats" >= ${filters.minSeats}`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(Prisma.sql`c."price" >= ${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(Prisma.sql`c."price" <= ${filters.maxPrice}`);
  }
  if (filters.minYear !== undefined) {
    conditions.push(Prisma.sql`c."year" >= ${filters.minYear}`);
  }
  if (filters.maxYear !== undefined) {
    conditions.push(Prisma.sql`c."year" <= ${filters.maxYear}`);
  }
  if (filters.minMileage !== undefined) {
    conditions.push(Prisma.sql`c."mileage" >= ${filters.minMileage}`);
  }
  if (filters.maxMileage !== undefined) {
    conditions.push(Prisma.sql`c."mileage" <= ${filters.maxMileage}`);
  }
  if (filters.featured !== undefined) {
    conditions.push(Prisma.sql`c."featured" = ${filters.featured}`);
  }

  return conditions;
}

/**
 * ORDER BY for a search page. An explicit sort wins; the default "newest" (or
 * unset) falls back to `relevance` — the match's ranking expressions, most
 * significant first — so the best matches lead.
 */
function buildOrderBy(sortBy, relevance) {
  switch (sortBy) {
    case "priceAsc":
      return Prisma.sql`c."price" ASC`;
    case "priceDesc":
      return Prisma.sql`c."price" DESC`;
    case "yearAsc":
      return Prisma.sql`c."year" ASC`;
    case "yearDesc":
      return Prisma.sql`c."year" DESC`;
    case "mileageAsc":
      return Prisma.sql`c."mileage" ASC`;
    case "mileageDesc":
      return Prisma.sql`c."mileage" DESC`;
    case "oldest":
      return Prisma.sql`c."createdAt" ASC`;
    default:
      return byRelevance(relevance);
  }
}

function byRelevance(relevance) {
  return Prisma.join([...relevance.map((r) => Prisma.sql`${r} DESC`), Prisma.sql`c."createdAt" DESC`], ", ");
}

const FROM = Prisma.sql`FROM "Car" c JOIN "Organization" o ON o."id" = c."organizationId"`;

/**
 * Whether a car has one search term (see SearchTerm in search-query.ts): in its
 * search vector — anywhere, or in the structured fields only — in its
 * dealership's place, or as its model year.
 *
 * A car is in a place because its dealership is. The vector covers the car's own
 * columns, and the only place among them is `location` — free text a dealer
 * typed — so a place term is matched against the dealership's canonical columns
 * too. A year is matched against its column, which the vector does not hold.
 * Both are structured, not prose.
 */
function termMatch(term, { structured = false } = {}) {
  const query = structured ? term.structuredQuery : term.query;
  const parts = [Prisma.sql`c."searchVector" @@ to_tsquery('simple', ${query})`];
  if (term.places.length > 0) {
    const places = Prisma.join(term.places);
    parts.push(Prisma.sql`o."city" IN (${places}) OR o."region" IN (${places})`);
  }
  if (term.year !== null) parts.push(Prisma.sql`c."year" = ${term.year}`);
  return Prisma.sql`(${Prisma.join(parts, " OR ")})`;
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
 * Returns the SQL to match and rank by, and the words set aside.
 */
async function analyzeTerms(conditions, terms) {
  if (terms.length === 0) return { tier: "none", missing: [] };

  const where = Prisma.join(conditions, " AND ");
  const counts = terms.flatMap((term, i) => [
    Prisma.sql`count(*) FILTER (WHERE ${termMatch(term)})::int AS ${Prisma.raw(`"df${i}"`)}`,
    Prisma.sql`count(*) FILTER (WHERE ${termMatch(term, { structured: true })})::int AS ${Prisma.raw(`"ds${i}"`)}`,
  ]);
  const [row] = await db.$queryRaw(Prisma.sql`
    SELECT count(*)::int AS n, ${Prisma.join(counts, ", ")}
    ${FROM}
    WHERE ${where}
  `);

  const n = row.n;
  const stats = terms.map((_, i) => ({ df: row[`df${i}`], dfStructured: row[`ds${i}`] }));
  const { roles, onlyCommon } = classifyTerms(n, stats);
  const missing = terms.filter((_, i) => roles[i] === "missing").map((term) => term.text);
  const filtering = terms.filter((_, i) => roles[i] === "filter");
  if (filtering.length === 0) return { tier: "none", missing };

  // Every word found ranks — those that only rank included.
  const found = terms.filter((_, i) => roles[i] !== "missing");
  const rankQuery = found.map((term) => term.query).join(" | ");
  const textRank = Prisma.sql`ts_rank(c."searchVector", to_tsquery('simple', ${rankQuery}))`;
  const all = Prisma.sql`(${Prisma.join(filtering.map((term) => termMatch(term)), " AND ")})`;

  if (filtering.length > 1) {
    const [{ count }] = await db.$queryRaw(Prisma.sql`SELECT count(*)::int AS count ${FROM} WHERE ${where} AND ${all}`);
    if (count === 0) {
      if (onlyCommon) return { tier: "none", missing };
      const coverage = Prisma.join(
        found.map((term) => {
          const idf = inverseDocumentFrequency(n, stats[terms.indexOf(term)].df);
          return Prisma.sql`CASE WHEN ${termMatch(term)} THEN ${idf}::float8 ELSE 0::float8 END`;
        }),
        " + "
      );
      return {
        tier: "some",
        missing,
        match: Prisma.sql`(${Prisma.join(filtering.map((term) => termMatch(term)), " OR ")})`,
        relevance: [Prisma.sql`(${coverage})`, textRank],
      };
    }
  }
  return { tier: "all", missing, match: all, relevance: [textRank] };
}

/** Run the rows + total-count pair for one match strategy. */
async function runSearch({ conditions, match, orderBy, limit, offset }) {
  const where = Prisma.join([...conditions, match], " AND ");

  const [rows, countRows] = await Promise.all([
    db.$queryRaw(Prisma.sql`
      SELECT ${CAR_COLUMNS}
      ${FROM}
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `),
    db.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::int AS count
      ${FROM}
      WHERE ${where}
    `),
  ]);

  return { rows, total: countRows[0]?.count ?? 0 };
}

/**
 * Hybrid: the cars the words match (best first) and the cars the meaning
 * matches (cosine, best first, only those near this search's best match — see
 * lib/search/hybrid.ts), fused by reciprocal rank. Every car in either list is
 * a result; the structured filters bound both lists alike. An explicit sort
 * orders the same set by its column instead.
 *
 * The words' list is not capped: it is every car the words match, so the total
 * and the last page are right however many there are. Only the meaning list,
 * which has no natural end, is.
 */
async function runHybrid({ conditions, lexical, meaning, sortBy, limit, offset }) {
  const where = Prisma.join(conditions, " AND ");
  const vector = Prisma.sql`${toVectorLiteral(meaning.vector)}::vector`;
  const fts = lexical.match
    ? Prisma.sql`
      SELECT c."id", row_number() OVER (ORDER BY ${byRelevance(lexical.relevance)}) AS r
      ${FROM}
      WHERE ${where} AND ${lexical.match}`
    : Prisma.sql`SELECT NULL::text AS "id", NULL::bigint AS r WHERE false`;

  const fused = Prisma.sql`
    WITH fts AS (${fts}),
    scored AS (
      SELECT c."id", 1 - (c."embedding" <=> ${vector}) AS s
      ${FROM}
      WHERE ${where} AND c."embeddingModel" = ${meaning.model} AND c."embedding" IS NOT NULL
    ),
    sem AS (
      SELECT "id", row_number() OVER (ORDER BY s DESC) AS r
      FROM scored
      WHERE s >= ${SEMANTIC_MIN_SIMILARITY} AND s >= (SELECT max(s) FROM scored) - ${SEMANTIC_WITHIN_BEST}
      ORDER BY r
      LIMIT ${HYBRID_CANDIDATES}
    ),
    fused AS (
      SELECT "id", SUM(1.0 / (${RRF_K} + r)) AS score
      FROM (SELECT "id", r FROM fts UNION ALL SELECT "id", r FROM sem) ranked
      GROUP BY "id"
    )`;

  const orderBy = buildOrderBy(sortBy, [Prisma.sql`f."score"`]);
  const [rows, countRows] = await Promise.all([
    db.$queryRaw(Prisma.sql`
      ${fused}
      SELECT ${CAR_COLUMNS}
      FROM fused f
      JOIN "Car" c ON c."id" = f."id"
      JOIN "Organization" o ON o."id" = c."organizationId"
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `),
    db.$queryRaw(Prisma.sql`${fused} SELECT COUNT(*)::int AS count FROM fused`),
  ]);

  return { rows, total: countRows[0]?.count ?? 0 };
}

/**
 * Ranked, filtered, paginated search. Intended for the search path only
 * (findManyCars still serves the no-search-term case).
 *
 * 1. The words are judged against the cars in scope (analyzeTerms): which
 *    filter, which only rank, which no car has.
 * 2. With the search text's meaning (filters.meaning, set by the listing
 *    service), words and meaning are fused — runHybrid. Without it, or if that
 *    query fails, the words alone.
 * 3. Fallback: if nothing at all is found, retry with trigram similarity on
 *    make/model for typo tolerance ("corola" → Corolla).
 *
 * `search` reports how the words matched, for the page to say so: `all`,
 * `some` (no car has them all), `meaning` (no word matched; cars by meaning),
 * `similar` (by spelling) or `none` — with the words set aside as `missing`.
 */
export async function searchCarsRanked(filters = {}, pagination = {}) {
  const {
    page = VALIDATION_RULES.PAGINATION.DEFAULT_PAGE,
    limit = VALIDATION_RULES.PAGINATION.DEFAULT_LIMIT,
  } = pagination;
  const offset = (page - 1) * limit;

  const term = (filters.search ?? "").trim();
  const conditions = buildStructuredConditions(filters);
  const lexical = await analyzeTerms(conditions, searchTerms(term));

  let result = { rows: [], total: 0 };

  let hybrid = false;
  if (filters.meaning) {
    try {
      result = await runHybrid({
        conditions,
        lexical,
        meaning: filters.meaning,
        sortBy: filters.sortBy,
        limit,
        offset,
      });
      hybrid = true;
    } catch (error) {
      // Meaning is an improvement, never a dependency: a deploy that reaches
      // production before its migration, or a database without pgvector,
      // searches by words alone rather than failing the page.
      logError("Hybrid car search failed; searching by words alone", error);
    }
  }

  if (!hybrid && lexical.match) {
    result = await runSearch({
      conditions,
      match: lexical.match,
      orderBy: buildOrderBy(filters.sortBy, lexical.relevance),
      limit,
      offset,
    });
  }

  let match = lexical.tier === "none" && result.total > 0 ? "meaning" : lexical.tier;
  let missing = lexical.missing;

  // Trigram compares against the English make/model columns, so an Arabic
  // query is resolved to the value it displays as before the comparison.
  const trigramTerm = toTrigramTerm(term);

  if (result.total === 0 && trigramTerm) {
    result = await runSearch({
      conditions,
      match: Prisma.sql`(c."make" % ${trigramTerm} OR c."model" % ${trigramTerm})`,
      orderBy: buildOrderBy(filters.sortBy, [
        Prisma.sql`GREATEST(similarity(c."make", ${trigramTerm}), similarity(c."model", ${trigramTerm}))`,
      ]),
      limit,
      offset,
    });
    if (result.total > 0) {
      match = "similar";
      missing = [];
    }
  }

  return {
    cars: serializeCars(result.rows),
    pagination: {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    },
    search: { match, missing },
  };
}
