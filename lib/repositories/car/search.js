// Tier 2 ranked car search (Postgres full-text + trigram fallback).
//
// STATUS: isolated, not yet wired into the query path. Once reviewed, this
// replaces the search branch of findManyCars (queries.js). Structured filters
// below mirror buildCarWhereClause (filters.js) — keep the two in sync until
// that logic is unified.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { serializeCars } from "@/lib/utils/serializers";
import { toPrefixTsquery, toTrigramTerm } from "./search-query";
import { expandSearchTerm } from "@/lib/locations";
import { VALIDATION_RULES } from "@/lib/constants/validation";

// Real columns to hydrate (everything except the tsvector, which never leaves
// the DB). Selected explicitly so `SELECT *` can't leak searchVector to clients.
const CAR_COLUMNS = Prisma.sql`
  c."id", c."organizationId", c."make", c."model", c."year", c."price",
  c."mileage", c."fuelType", c."transmission", c."color", c."seats",
  c."bodyType", c."featured", c."status", c."images", c."title",
  c."description", c."titleEn", c."titleAr", c."descriptionEn",
  c."descriptionAr", c."location", c."features", c."featuresAr",
  c."createdAt", c."updatedAt",
  json_build_object('name', o."name", 'logo', o."logo", 'slug', o."slug") AS organization
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
 * Ranked, filtered, paginated search. Intended for the search path only
 * (findManyCars still serves the no-search-term case).
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

  if (tsquery) {
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
