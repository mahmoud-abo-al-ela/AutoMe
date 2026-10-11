// Ranked car search — the search branch of findManyCars (queries.js).
//
// Words and meaning fused (runHybrid) when the listing service supplies the
// search text's meaning; full text with a trigram fallback otherwise.
// Structured filters below mirror buildCarWhereClause (filters.js) — keep the
// two in sync until that logic is unified.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { serializeCars } from "@/lib/utils/serializers";
import { logError } from "@/lib/utils/errors";
import { toPrefixTsquery, toTrigramTerm } from "./search-query";
import { expandSearchTerm } from "@/lib/locations";
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
 * unset) falls back to `relevance` — the ts_rank / similarity expression — so
 * the best matches lead. `relevance` is a Prisma.Sql fragment.
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
      return Prisma.sql`${relevance} DESC, c."createdAt" DESC`;
  }
}

/**
 * A car is in a place because its dealership is.
 *
 * The search vector covers the car's own columns, and the only place among them
 * is `location` — free text a dealer typed, which may say anything or nothing.
 * The dealership's canonical columns are the reliable answer, and the query
 * already joins them, so a place term is matched against those too rather than
 * hoping it turns up in prose.
 */
function matchesDealershipPlace(term) {
  const { exact } = expandSearchTerm(term);
  if (exact.length === 0) return Prisma.sql`false`;

  return Prisma.sql`(o."city" IN (${Prisma.join(exact)}) OR o."region" IN (${Prisma.join(exact)}))`;
}

/** Run the rows + total-count pair for one match strategy. */
async function runSearch({ conditions, match, orderBy, limit, offset }) {
  const where = Prisma.join([...conditions, match], " AND ");

  const [rows, countRows] = await Promise.all([
    db.$queryRaw(Prisma.sql`
      SELECT ${CAR_COLUMNS}
      FROM "Car" c
      JOIN "Organization" o ON o."id" = c."organizationId"
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `),
    db.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Car" c
      JOIN "Organization" o ON o."id" = c."organizationId"
      WHERE ${where}
    `),
  ]);

  return { rows, total: countRows[0]?.count ?? 0 };
}

/**
 * Hybrid: the cars the words match (full text, best first) and the cars the
 * meaning matches (cosine, best first, only those near this search's best
 * match — see lib/search/hybrid.ts), fused by reciprocal rank. Every car in
 * either list is a result; the structured filters bound both lists alike.
 * An explicit sort orders the same set by its column instead.
 */
async function runHybrid({ conditions, tsquery, term, meaning, sortBy, limit, offset }) {
  const where = Prisma.join(conditions, " AND ");
  const vector = Prisma.sql`${toVectorLiteral(meaning.vector)}::vector`;
  const fts = tsquery
    ? Prisma.sql`
      SELECT c."id", row_number() OVER (ORDER BY ts_rank(c."searchVector", to_tsquery('simple', ${tsquery})) DESC, c."createdAt" DESC) AS r
      FROM "Car" c
      JOIN "Organization" o ON o."id" = c."organizationId"
      WHERE ${where} AND (c."searchVector" @@ to_tsquery('simple', ${tsquery}) OR ${matchesDealershipPlace(term)})
      ORDER BY r
      LIMIT ${HYBRID_CANDIDATES}`
    : Prisma.sql`SELECT NULL::text AS "id", NULL::bigint AS r WHERE false`;

  const fused = Prisma.sql`
    WITH fts AS (${fts}),
    scored AS (
      SELECT c."id", 1 - (c."embedding" <=> ${vector}) AS s
      FROM "Car" c
      JOIN "Organization" o ON o."id" = c."organizationId"
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

  const orderBy = buildOrderBy(sortBy, Prisma.sql`f."score"`);
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
 * With the search text's meaning (filters.meaning, set by the listing
 * service), words and meaning are fused — runHybrid. Without it, or when
 * neither finds anything, the words alone, as below.
 *
 * 1. Full-text: prefix tsquery matched against the weighted searchVector,
 *    ordered by ts_rank so make/model hits outrank description hits.
 * 2. Fallback: if FTS finds nothing, retry with trigram similarity on
 *    make/model for typo tolerance ("corola" → Corolla).
 */
export async function searchCarsRanked(filters = {}, pagination = {}) {
  const {
    page = VALIDATION_RULES.PAGINATION.DEFAULT_PAGE,
    limit = VALIDATION_RULES.PAGINATION.DEFAULT_LIMIT,
  } = pagination;
  const offset = (page - 1) * limit;

  const term = (filters.search ?? "").trim();
  const conditions = buildStructuredConditions(filters);
  const tsquery = toPrefixTsquery(term);

  let result = { rows: [], total: 0 };

  let hybrid = false;
  if (filters.meaning) {
    try {
      result = await runHybrid({
        conditions,
        tsquery,
        term,
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

  if (!hybrid && tsquery) {
    const query = Prisma.sql`to_tsquery('simple', ${tsquery})`;
    result = await runSearch({
      conditions,
      match: Prisma.sql`(c."searchVector" @@ ${query} OR ${matchesDealershipPlace(term)})`,
      orderBy: buildOrderBy(
        filters.sortBy,
        Prisma.sql`ts_rank(c."searchVector", ${query})`
      ),
      limit,
      offset,
    });
  }

  // Trigram compares against the English make/model columns, so an Arabic
  // query is resolved to the value it displays as before the comparison.
  const trigramTerm = toTrigramTerm(term);

  if (result.total === 0 && trigramTerm) {
    result = await runSearch({
      conditions,
      match: Prisma.sql`(c."make" % ${trigramTerm} OR c."model" % ${trigramTerm})`,
      orderBy: buildOrderBy(
        filters.sortBy,
        Prisma.sql`GREATEST(similarity(c."make", ${trigramTerm}), similarity(c."model", ${trigramTerm}))`
      ),
      limit,
      offset,
    });
  }

  return {
    cars: serializeCars(result.rows),
    pagination: {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    },
  };
}
