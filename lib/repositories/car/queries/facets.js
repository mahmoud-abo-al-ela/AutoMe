// The filter panel's options: values with their counts, and the price, year and mileage ranges.

import { db } from "@/lib/prisma";
import { buildCarWhereClause } from "../filters";

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

  // Asked of Organization rather than Car: the facet is a list of cities, and
  // there are far fewer dealerships than cars. Loading one car row per
  // dealership and deduping in Node, as this did, read a column it then threw
  // away for every row but the first.
  const organizations = await db.organization.findMany({
    where: { city: { not: null }, cars: { some: where } },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });

  return organizations.flatMap(({ city }) => (city ? [city] : []));
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
