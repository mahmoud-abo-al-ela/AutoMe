// Car filter/query builder functions
import { CAR_STATUS } from "@/lib/constants/car-options";

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
