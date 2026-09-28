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
          city: true,
          region: true,
          phone: true,
          address: true,
          // The dealership's standing terms, shown on every one of its listings.
          offersFinancing: true,
          financingNote: true,
          acceptsTradeIn: true,
          allowsInspection: true,
          offersDelivery: true,
        },
      },
    },
  });

  return serializeCar(car);
}

/**
 * The car as the buyer assistant may see it: the public listing fields, the
 * dealership's public details and its working hours — nothing else. An
 * explicit select, so a column added to Car later is not handed to the model
 * until someone decides it should be.
 *
 * Not serialized: `price` stays a Decimal for the caller to convert.
 *
 * @param {string} id
 */
export async function findCarForAssistant(id) {
  return db.car.findUnique({
    where: { id },
    select: {
      id: true,
      organizationId: true,
      make: true,
      model: true,
      year: true,
      bodyType: true,
      color: true,
      seats: true,
      fuelType: true,
      transmission: true,
      mileage: true,
      price: true,
      priceCurrency: true,
      status: true,
      title: true,
      titleEn: true,
      titleAr: true,
      description: true,
      descriptionEn: true,
      descriptionAr: true,
      features: true,
      featuresAr: true,
      originalPaint: true,
      accidentFree: true,
      ownerCount: true,
      serviceHistory: true,
      priceNegotiable: true,
      licenseValidUntil: true,
      images: true,
      imageAlts: true,
      createdAt: true,
      organization: {
        select: {
          name: true,
          description: true,
          website: true,
          averageRating: true,
          totalReviews: true,
          offersFinancing: true,
          financingNote: true,
          acceptsTradeIn: true,
          allowsInspection: true,
          offersDelivery: true,
          city: true,
          region: true,
          address: true,
          phone: true,
          workingHours: {
            select: { dayOfWeek: true, openTime: true, closeTime: true, isOpen: true },
            orderBy: { dayOfWeek: "asc" },
          },
        },
      },
    },
  });
}

/**
 * The dealership's other cars on sale, for the assistant to offer as
 * alternatives. Same organization only — the id is the car's own, read from
 * the database — and only what the public listing shows.
 *
 * @param {string} organizationId
 * @param {string} excludeCarId
 * @param {number} [take]
 */
export async function findOtherAvailableCars(organizationId, excludeCarId, take = 40) {
  return db.car.findMany({
    where: { organizationId, status: "AVAILABLE", id: { not: excludeCarId } },
    select: {
      year: true,
      make: true,
      model: true,
      color: true,
      price: true,
      mileage: true,
      bodyType: true,
      transmission: true,
      fuelType: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/**
 * Asking prices of comparable cars on AutoMe, across every dealership: same
 * make, and the same model or the same body type, within `yearSpan` model
 * years either side. Prices only — the caller reduces them to a range, so no
 * other dealer's listing is ever named.
 *
 * @param {{ make: string, model?: string, bodyType?: string, year: number, yearSpan: number, excludeCarId: string, currency: string }} comparison
 */
export async function findComparablePrices({ make, model, bodyType, year, yearSpan, excludeCarId, currency }) {
  const rows = await db.car.findMany({
    where: {
      make: { equals: make, mode: "insensitive" },
      ...(model ? { model: { equals: model, mode: "insensitive" } } : {}),
      ...(bodyType ? { bodyType: { equals: bodyType, mode: "insensitive" } } : {}),
      year: { gte: year - yearSpan, lte: year + yearSpan },
      status: "AVAILABLE",
      priceCurrency: currency,
      id: { not: excludeCarId },
    },
    select: { price: true },
    take: 500,
  });
  return rows.map((row) => Number(row.price));
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
