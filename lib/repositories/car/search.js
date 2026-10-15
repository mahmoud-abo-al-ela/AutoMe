// Ranked car search — the search branch of findManyCars (queries.js).
//
// Each word is first judged against the cars in scope (analyzeTerms, in
// search-words.js): required, a ranking signal only, or missing — a misspelt
// word corrected first, from the search's vocabulary (search-terms.ts). Then the words that filter are matched
// — all of them, or failing that some — and fused with the search's meaning
// (runHybrid) when the listing service supplies it; full text alone otherwise.
// Structured filters below mirror buildCarWhereClause (filters.js) — keep the
// two in sync until that logic is unified.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { serializeCars } from "@/lib/utils/serializers";
import { logError } from "@/lib/utils/errors";
import { searchTerms } from "./search-query";
import { FROM, analyzeTerms } from "./search-words";
import { PUBLIC_DEALERSHIP_SQL } from "./visibility";
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
  c."imageAlts", c."createdAt", c."updatedAt",
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

/** The filters a buyer picks values of in the filter panel, which counts each one's options. */
export const SELECTABLE_FILTERS = ["make", "bodyType", "fuelType", "transmission", "color", "dealership", "city"];

/**
 * The condition one selectable filter adds, or undefined when it is unset —
 * or, for dealership and city, when the search is one dealership's own, where
 * they mean nothing. The filter panel's counts test each one on its own
 * (search-facets.ts), so they and the results apply the very same SQL.
 */
export function selectableCondition(field, filters) {
  switch (field) {
    case "dealership":
      return !filters.organizationId && filters.dealership ? Prisma.sql`o."slug" = ${filters.dealership}` : undefined;
    case "city":
      return !filters.organizationId && filters.city ? Prisma.sql`lower(o."city") = lower(${filters.city})` : undefined;
    case "color":
      return filters.color && filters.color.trim() !== ""
        ? Prisma.sql`c."color" ILIKE ${`%${filters.color.trim()}%`}`
        : undefined;
    default:
      return matchCondition(field, filters[field]);
  }
}

/**
 * Structured (non-text) filter conditions, mirroring buildCarWhereClause.
 * Returns an array of Prisma.Sql fragments to be AND-ed together.
 *
 * Public unless the caller says otherwise (visibility.ts): one dealership's
 * storefront is public too, so the dealership must still be active. Only a
 * dealer's own dashboard passes `scope: "dealer"`.
 *
 * @param {Record<string, any>} filters
 * @param {{ scope?: import("./visibility").VisibilityScope }} [options]
 */
export function buildStructuredConditions(filters, { scope = "public" } = {}) {
  const conditions = [];

  if (filters.organizationId) {
    conditions.push(Prisma.sql`c."organizationId" = ${filters.organizationId}`);
  }
  if (scope === "public") {
    conditions.push(PUBLIC_DEALERSHIP_SQL);
  }

  // Status (default AVAILABLE for public listings).
  if (filters.status !== undefined) {
    conditions.push(Prisma.sql`c."status" = ${filters.status}::"CarStatus"`);
  } else if (filters.onlyAvailable !== false) {
    conditions.push(Prisma.sql`c."status" = 'AVAILABLE'::"CarStatus"`);
  }

  for (const field of SELECTABLE_FILTERS) {
    const condition = selectableCondition(field, filters);
    if (condition) conditions.push(condition);
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
 *    filter, which only rank, which no car has — a typo corrected first
 *    ("corola" → corolla).
 * 2. With the search text's meaning (filters.meaning, set by the listing
 *    service), words and meaning are fused — runHybrid. Without it, or if that
 *    query fails, the words alone.
 *
 * `search` reports how the words matched, for the page to say so: `all`,
 * `some` (no car has them all), `meaning` (no word matched; cars by meaning)
 * or `none` — with the words set aside as `missing`, and the typos and what
 * they were read as as `corrected`.
 */
export async function searchCarsRanked(filters = {}, pagination = {}) {
  const {
    page = VALIDATION_RULES.PAGINATION.DEFAULT_PAGE,
    limit = VALIDATION_RULES.PAGINATION.DEFAULT_LIMIT,
  } = pagination;
  const offset = (page - 1) * limit;

  const term = (filters.search ?? "").trim();
  const conditions = buildStructuredConditions(filters);
  const lexical = await analyzeTerms(conditions, searchTerms(term), { correct: filters.exact !== true });

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

  const match = lexical.tier === "none" && result.total > 0 ? "meaning" : lexical.tier;

  return {
    cars: serializeCars(result.rows),
    pagination: {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    },
    search: { match, missing: lexical.missing, corrected: lexical.corrected },
  };
}

/**
 * The WHERE for one dealership's cars that a search's words match — judged
 * and corrected exactly as the public search judges them (analyzeTerms), but
 * by words alone: no meaning, no ranking. For the dealer's own Cars table,
 * which sorts and pages its own way (repositories/dashboard/inventory.ts),
 * over FROM (c, o).
 *
 * Every status unless one is given, as the Cars table shows them; the
 * dealership's own scope is in the condition. Null when no word matched: the
 * search finds nothing, as it always did — never everything.
 *
 * @param {{ organizationId: string, status?: string, bodyType?: string, minYear?: number, featured?: boolean, search?: string }} filters
 */
export async function dealerSearchCondition({ organizationId, status, bodyType, minYear, featured, search }) {
  const conditions = buildStructuredConditions(
    { organizationId, status, bodyType, minYear, featured, onlyAvailable: false },
    { scope: "dealer" }
  );
  const lexical = await analyzeTerms(conditions, searchTerms(search ?? ""));
  return lexical.match ? Prisma.join([...conditions, lexical.match], " AND ") : null;
}
