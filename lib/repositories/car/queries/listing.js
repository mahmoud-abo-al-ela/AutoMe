// Car listing reads: the paginated, filtered list and the cars it is built from.

import { db } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { serializeCars } from "@/lib/utils/serializers";
import { buildCarWhereClause, buildCarOrderBy } from "../filters";
import { searchCarsRanked } from "../search";
import { VALIDATION_RULES } from "@/lib/constants/validation";

/**
 * Find cars with filters and pagination.
 *
 * A free-text search term routes to the ranked full-text path (searchCarsRanked)
 * so results are relevance-ordered; every other listing keeps the plain Prisma
 * query. Facet counts and range aggregates still restrict by the tokenized
 * search in buildCarWhereClause.
 *
 * ⚠️ Those two no longer agree on Arabic. The FTS side folds the query and the
 * stored vector the same way (lib/utils/search-text.ts), so "سياره" reaches a
 * listing written "سيارة"; buildCarWhereClause compares the raw token with
 * `contains`, which does not. So an Arabic search returns the right cars while
 * the facet counts beside them under-report. Folding cannot be bolted onto
 * `contains` — it would need an expression index — so the fix is for the facets
 * to ask the same tsvector the results do, which is the unification this file
 * and search.js have both been waiting on.
 */
export async function findManyCars(filters = {}, pagination = {}) {
  if (filters.search && filters.search.trim() !== "") {
    return searchCarsRanked(filters, pagination);
  }

  const {
    page = VALIDATION_RULES.PAGINATION.DEFAULT_PAGE,
    limit = VALIDATION_RULES.PAGINATION.DEFAULT_LIMIT,
  } = pagination;

  const skip = (page - 1) * limit;
  const where = buildCarWhereClause(filters);
  const orderBy = buildCarOrderBy(filters.sortBy);

  const [cars, total] = await Promise.all([
    db.car.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        organization: {
          select: {
            name: true,
            logo: true,
            slug: true,
            // Where the car is shown as being: see usePlaceNames().car.
            city: true,
            region: true,
          },
        },
      },
    }),
    db.car.count({ where }),
  ]);

  return {
    cars: serializeCars(cars),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Count an organization's cars (backs the `cars` plan-limit gate).
 */
export async function countCars(organizationId) {
  return db.car.count({ where: { organizationId } });
}

/**
 * Find cars by multiple IDs, optionally filtered by organization.
 *
 * JSDoc-typed because this module is still JS: without it the `= null` default
 * makes TS infer `organizationId: null`, rejecting every real caller.
 *
 * @param {string[]} ids
 * @param {string | null} [organizationId]
 */
export async function findCarsByIds(ids, organizationId = null) {
  const where = { id: { in: ids } };
  if (organizationId) {
    where.organizationId = organizationId;
  }

  const cars = await db.car.findMany({ where });

  return serializeCars(cars);
}

/**
 * Just the fields a car's title is built from, for many cars at once — the
 * chat's conversation lists, whose saved snapshot holds only the English
 * title. An explicit select: public listing fields and nothing else.
 *
 * @param {string[]} ids
 */
export async function findCarTitlesByIds(ids) {
  return db.car.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, titleEn: true, titleAr: true, make: true, model: true, year: true },
  });
}
