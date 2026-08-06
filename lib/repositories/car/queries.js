// Car query functions
import { db } from "@/lib/prisma";
import { serializeCar, serializeCars } from "@/lib/utils/serializers";
import { buildCarWhereClause, buildCarOrderBy } from "./filters";
import { searchCarsRanked } from "./search";
import { VALIDATION_RULES } from "@/lib/constants/validation";

/**
 * Find cars with filters and pagination.
 *
 * A free-text search term routes to the ranked full-text path (searchCarsRanked)
 * so results are relevance-ordered; every other listing keeps the plain Prisma
 * query. Facet counts and range aggregates still restrict by the tokenized
 * search in buildCarWhereClause, which stays close enough to the FTS match.
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
 * Find a single car by ID
 */
export async function findCarById(id) {
  const car = await db.car.findUnique({
    where: { id },
    include: {
      organization: {
        select: {
          name: true,
          logo: true,
          slug: true,
          phone: true,
          address: true,
        },
      },
    },
  });

  return serializeCar(car);
}

/**
 * Count an organization's cars (backs the `cars` plan-limit gate).
 */
export async function countCars(organizationId) {
  return db.car.count({ where: { organizationId } });
}

/**
 * Find cars by multiple IDs, optionally filtered by organization
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
 * Get distinct values for filters
 */
export async function getCarDistinctValues(field, baseFilters = {}) {
  const where = buildCarWhereClause(baseFilters);
  delete where[field];

  const results = await db.car.findMany({
    where,
    select: { [field]: true },
    distinct: [field],
    orderBy: { [field]: "asc" },
  });

  return results.map((item) => item[field]);
}

/**
 * Get distinct values for a field along with the count of cars for each value.
 * The field itself is excluded from the where clause so counts reflect what
 * selecting each value would yield given the other active filters.
 * Returns [{ value, count }] sorted by value.
 */
export async function getCarFieldCounts(field, baseFilters = {}) {
  const where = buildCarWhereClause(baseFilters);
  delete where[field];

  const groups = await db.car.groupBy({
    by: [field],
    where,
    _count: { _all: true },
    orderBy: { [field]: "asc" },
  });

  return groups
    .filter((g) => g[field] !== null && g[field] !== undefined && g[field] !== "")
    .map((g) => ({ value: g[field], count: g._count._all }));
}

/**
 * Get dealership options for cross-tenant car filters
 */
export async function getCarDealershipOptions(baseFilters = {}) {
  const where = buildCarWhereClause({
    ...baseFilters,
    dealership: undefined,
  });

  const cars = await db.car.findMany({
    where,
    select: {
      organization: {
        select: { name: true, slug: true, logo: true },
      },
    },
    distinct: ["organizationId"],
  });

  return cars
    .map((car) => car.organization)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get city options for cross-tenant car filters
 */
export async function getCarCityOptions(baseFilters = {}) {
  const where = buildCarWhereClause({
    ...baseFilters,
    city: undefined,
  });

  const cars = await db.car.findMany({
    where,
    select: {
      organization: {
        select: { city: true },
      },
    },
    distinct: ["organizationId"],
  });

  return [...new Set(cars.map((car) => car.organization?.city).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Get price range
 */
export async function getCarPriceRange(filters = {}) {
  const where = buildCarWhereClause(filters);

  const result = await db.car.aggregate({
    where,
    _min: { price: true },
    _max: { price: true },
  });

  return {
    min: result._min.price ? parseFloat(result._min.price.toString()) : 0,
    max: result._max.price ? parseFloat(result._max.price.toString()) : 1000000,
  };
}

/**
 * Get year range
 */
export async function getCarYearRange(filters = {}) {
  const where = buildCarWhereClause(filters);

  const result = await db.car.aggregate({
    where,
    _min: { year: true },
    _max: { year: true },
  });

  const currentYear = new Date().getFullYear();
  return {
    min: result._min.year ?? 1990,
    max: result._max.year ?? currentYear,
  };
}

/**
 * Get mileage range
 */
export async function getCarMileageRange(filters = {}) {
  const where = buildCarWhereClause(filters);

  const result = await db.car.aggregate({
    where,
    _min: { mileage: true },
    _max: { mileage: true },
  });

  return {
    min: result._min.mileage ?? 0,
    max: result._max.mileage ?? 200000,
  };
}
