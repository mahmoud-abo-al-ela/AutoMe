// Car data access layer - Functional approach
import { db } from "@/lib/prisma";
import { serializeCar, serializeCars } from "@/lib/utils/serializers";
import { CAR_STATUS } from "@/lib/constants/car-options";
import { VALIDATION_RULES } from "@/lib/constants/validation";

/**
 * Build where clause from filters
 */
export function buildCarWhereClause(filters) {
    const where = {};

    // Status filter (default to AVAILABLE for public listings)
    if (filters.status !== undefined) {
        where.status = filters.status;
    } else if (filters.onlyAvailable !== false) {
        where.status = CAR_STATUS.AVAILABLE;
    }

    // Search filter
    if (filters.search && filters.search.trim() !== "") {
        where.OR = [
            { make: { contains: filters.search, mode: "insensitive" } },
            { model: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
        ];
    }

    // Exact match filters
    if (filters.make) where.make = filters.make;
    if (filters.bodyType) where.bodyType = filters.bodyType;
    if (filters.fuelType) where.fuelType = filters.fuelType;
    if (filters.transmission) where.transmission = filters.transmission;

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {};
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    // Featured filter
    if (filters.featured !== undefined) {
        where.featured = filters.featured;
    }

    return where;
}

/**
 * Build order by clause
 */
export function buildCarOrderBy(sortBy = "newest") {
    const sortMap = {
        newest: { createdAt: "desc" },
        oldest: { createdAt: "asc" },
        priceAsc: { price: "asc" },
        priceDesc: { price: "desc" },
        yearAsc: { year: "asc" },
        yearDesc: { year: "desc" },
    };

    return sortMap[sortBy] || sortMap.newest;
}

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
    });

    return serializeCar(car);
}

/**
 * Find cars by multiple IDs
 */
export async function findCarsByIds(ids) {
    const cars = await db.car.findMany({
        where: {
            id: { in: ids },
        },
    });

    return serializeCars(cars);
}

/**
 * Create a new car
 */
export async function createCar(carData) {
    const car = await db.car.create({
        data: carData,
    });

    return serializeCar(car);
}

/**
 * Update a car
 */
export async function updateCar(id, carData) {
    const car = await db.car.update({
        where: { id },
        data: carData,
    });

    return serializeCar(car);
}

/**
 * Delete a car
 */
export async function deleteCarById(id) {
    await db.car.delete({
        where: { id },
    });
}

/**
 * Get distinct values for filters
 */
export async function getCarDistinctValues(field, baseFilters = {}) {
    const where = buildCarWhereClause(baseFilters);
    delete where[field]; // Exclude the field we're getting values for

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
