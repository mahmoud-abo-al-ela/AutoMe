// Dealership repository - detail/profile queries
import { db } from "@/lib/prisma";

export async function findDealershipBySlug(slug) {
    const dealership = await db.organization.findUnique({
        where: {
            slug,
            isActive: true,
            deletedAt: null,
        },
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
            workingHours: {
                orderBy: {
                    dayOfWeek: "asc",
                },
            },
            _count: {
                select: {
                    cars: {
                        where: {
                            status: "AVAILABLE",
                        },
                    },
                    dealershipReviews: {
                        where: {
                            isApproved: true,
                        },
                    },
                },
            },
        },
    });

    if (!dealership) {
        return null;
    }

    return {
        ...dealership,
        carCount: dealership._count.cars,
        reviewCount: dealership._count.dealershipReviews,
        _count: undefined,
    };
}

/**
 * Search dealerships with full-text search
 */

export async function findOrganizationProfile(organizationId) {
    return db.organization.findUnique({
        where: { id: organizationId },
        select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            email: true,
            phone: true,
            website: true,
            address: true,
            description: true,
            city: true,
            region: true,
            country: true,
        },
    });
}

/**
 * Update editable organization profile fields
 */

export async function findDealershipCars(
    organizationId,
    filters = {},
    pagination = {}
) {
    const {
        search,
        make,
        model,
        minPrice,
        maxPrice,
        minYear,
        maxYear,
        fuelType,
        transmission,
        bodyType,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = filters;

    const { page = 1, limit = 12 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
        organizationId,
        status: "AVAILABLE",
    };

    // Full-text search across make + model
    if (search) {
        where.OR = [
            { make: { contains: search, mode: "insensitive" } },
            { model: { contains: search, mode: "insensitive" } },
        ];
    }

    if (make) {
        where.make = { contains: make, mode: "insensitive" };
    }

    if (model) {
        where.model = { contains: model, mode: "insensitive" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) {
            where.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
            where.price.lte = maxPrice;
        }
    }

    if (minYear !== undefined || maxYear !== undefined) {
        where.year = {};
        if (minYear !== undefined) {
            where.year.gte = minYear;
        }
        if (maxYear !== undefined) {
            where.year.lte = maxYear;
        }
    }

    if (fuelType) {
        where.fuelType = fuelType;
    }

    if (transmission) {
        where.transmission = transmission;
    }

    if (bodyType) {
        where.bodyType = bodyType;
    }

    let orderBy = {};
    switch (sortBy) {
        case "priceAsc":
            orderBy = { price: "asc" };
            break;
        case "priceDesc":
            orderBy = { price: "desc" };
            break;
        case "price":
            orderBy = { price: sortOrder };
            break;
        case "year":
            orderBy = { year: "desc" };
            break;
        case "mileage":
            orderBy = { mileage: "asc" };
            break;
        case "newest":
        case "createdAt":
        default:
            orderBy = { createdAt: "desc" };
            break;
    }

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
        cars,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get filter options for a specific dealership's inventory
 */

export async function getDealershipCarFilterOptions(organizationId) {
    const baseWhere = {
        organizationId,
        status: "AVAILABLE",
    };

    const [bodyTypes, fuelTypes, transmissions, priceRange] = await Promise.all([
        db.car.findMany({
            where: baseWhere,
            select: { bodyType: true },
            distinct: ["bodyType"],
            orderBy: { bodyType: "asc" },
        }),
        db.car.findMany({
            where: baseWhere,
            select: { fuelType: true },
            distinct: ["fuelType"],
            orderBy: { fuelType: "asc" },
        }),
        db.car.findMany({
            where: baseWhere,
            select: { transmission: true },
            distinct: ["transmission"],
            orderBy: { transmission: "asc" },
        }),
        db.car.aggregate({
            where: baseWhere,
            _min: { price: true },
            _max: { price: true },
        }),
    ]);

    return {
        bodyTypes: bodyTypes.map((item) => item.bodyType).filter(Boolean),
        fuelTypes: fuelTypes.map((item) => item.fuelType).filter(Boolean),
        transmissions: transmissions.map((item) => item.transmission).filter(Boolean),
        priceRange: {
            min: priceRange._min.price ? parseFloat(priceRange._min.price.toString()) : 0,
            max: priceRange._max.price ? parseFloat(priceRange._max.price.toString()) : 0,
        },
    };
}

/**
 * Get dealership reviews with pagination
 */
