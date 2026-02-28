// Car query functions
import { db } from "@/lib/prisma";
import { serializeCar, serializeCars } from "@/lib/utils/serializers";
import { buildCarWhereClause, buildCarOrderBy } from "./filters";
import { VALIDATION_RULES } from "@/lib/constants/validation";

/**
 * Find cars with filters and pagination
 */
export async function findManyCars(filters = {}, pagination = {}) {
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
