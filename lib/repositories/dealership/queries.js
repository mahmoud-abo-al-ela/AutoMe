// Dealership repository queries
import { db } from "@/lib/prisma";

/**
 * Find dealerships with filters and pagination
 */
export async function findDealerships(filters = {}, pagination = {}) {
    const {
        search,
        planType,
        city,
        region,
        minRating,
        maxRating,
        minCarCount,
        maxCarCount,
        sortBy = "rating",
        sortOrder = "desc",
    } = filters;

    const { page = 1, limit = 12 } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
        isActive: true,
        deletedAt: null,
    };

    // Search filter (name, description, address)
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { region: { contains: search, mode: "insensitive" } },
        ];
    }

    if (city) {
        where.city = { equals: city, mode: "insensitive" };
    }

    if (region) {
        where.region = { equals: region, mode: "insensitive" };
    }

    // Plan type filter
    if (planType) {
        where.subscription = {
            plan: {
                type: planType,
            },
        };
    }

    // Rating filter
    if (minRating !== undefined || maxRating !== undefined) {
        where.averageRating = {};
        if (minRating !== undefined) {
            where.averageRating.gte = minRating;
        }
        if (maxRating !== undefined) {
            where.averageRating.lte = maxRating;
        }
    }

    // Car count filter
    if (minCarCount !== undefined || maxCarCount !== undefined) {
        where.cars = {};
        if (minCarCount !== undefined) {
            where.cars.some = {
                status: "AVAILABLE",
            };
        }
    }

    // Build order by clause
    let orderBy = [];
    switch (sortBy) {
        case "rating":
            orderBy = [
                { averageRating: sortOrder },
                { totalReviews: sortOrder },
                { name: "asc" }
            ];
            break;
        case "carCount":
            // Can't order by relation count directly, use createdAt as fallback
            orderBy = { createdAt: sortOrder };
            break;
        case "newest":
            orderBy = { createdAt: sortOrder };
            break;
        case "name":
            orderBy = { name: sortOrder };
            break;
        default:
            orderBy = [
                { averageRating: "desc" },
                { totalReviews: "desc" },
                { name: "asc" }
            ];
    }

    // Execute query
    const [dealerships, total] = await Promise.all([
        db.organization.findMany({
            where,
            include: {
                subscription: {
                    include: {
                        plan: true,
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
            orderBy,
            skip,
            take: limit,
        }),
        db.organization.count({ where }),
    ]);

    return {
        dealerships: dealerships.map((dealership) => ({
            ...dealership,
            carCount: dealership._count.cars,
            reviewCount: dealership._count.dealershipReviews,
            _count: undefined,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get distinct active dealership locations for filters
 */
export async function getDealershipDistinctLocations() {
    const [cities, regions] = await Promise.all([
        db.organization.findMany({
            where: { isActive: true, deletedAt: null, city: { not: null } },
            select: { city: true },
            distinct: ["city"],
            orderBy: { city: "asc" },
        }),
        db.organization.findMany({
            where: { isActive: true, deletedAt: null, region: { not: null } },
            select: { region: true },
            distinct: ["region"],
            orderBy: { region: "asc" },
        }),
    ]);

    return {
        cities: cities.map((item) => item.city).filter(Boolean),
        regions: regions.map((item) => item.region).filter(Boolean),
    };
}

/**
 * Get platform-wide discovery stats
 */
export async function getPlatformStats() {
    const [totalDealerships, totalCars, cities] = await Promise.all([
        db.organization.count({
            where: { isActive: true, deletedAt: null },
        }),
        db.car.count({
            where: {
                status: "AVAILABLE",
                organization: {
                    is: { isActive: true, deletedAt: null },
                },
            },
        }),
        db.organization.findMany({
            where: { isActive: true, deletedAt: null, city: { not: null } },
            select: { city: true },
            distinct: ["city"],
        }),
    ]);

    return {
        totalDealerships,
        totalCars,
        totalCities: cities.length,
    };
}

/**
 * Find dealership by slug with full details
 */
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
export async function searchDealerships(query, filters = {}, pagination = {}) {
    return findDealerships(
        {
            ...filters,
            search: query,
        },
        pagination
    );
}

/**
 * Find editable organization profile fields
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
export async function updateOrganizationProfile(organizationId, data) {
    return db.organization.update({
        where: { id: organizationId },
        data,
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
 * Count dealerships with filters
 */
export async function countDealerships(filters = {}) {
    const {
        search,
        planType,
        city,
        region,
        minRating,
        maxRating,
    } = filters;

    const where = {
        isActive: true,
        deletedAt: null,
    };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { region: { contains: search, mode: "insensitive" } },
        ];
    }

    if (city) {
        where.city = { equals: city, mode: "insensitive" };
    }

    if (region) {
        where.region = { equals: region, mode: "insensitive" };
    }

    if (planType) {
        where.subscription = {
            plan: {
                type: planType,
            },
        };
    }

    if (minRating !== undefined || maxRating !== undefined) {
        where.averageRating = {};
        if (minRating !== undefined) {
            where.averageRating.gte = minRating;
        }
        if (maxRating !== undefined) {
            where.averageRating.lte = maxRating;
        }
    }

    return db.organization.count({ where });
}

/**
 * Get dealership cars with pagination and filters
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
export async function findDealershipReviews(
    organizationId,
    pagination = {}
) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
        db.dealershipReview.findMany({
            where: {
                organizationId,
                isApproved: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),
        db.dealershipReview.count({
            where: {
                organizationId,
                isApproved: true,
            },
        }),
    ]);

    return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Check if user has already reviewed a dealership
 */
export async function findUserReviewForDealership(
    organizationId,
    userId
) {
    return db.dealershipReview.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
    });
}

/**
 * Create dealership review
 */
export async function createDealershipReview(data) {
    const { organizationId, userId, rating, title, comment } = data;

    return db.dealershipReview.create({
        data: {
            organizationId,
            userId,
            rating,
            title,
            comment,
            isApproved: false, // Requires admin approval
        },
    });
}

/**
 * Update dealership average rating
 */
export async function updateDealershipRating(organizationId) {
    // Get all approved reviews
    const reviews = await db.dealershipReview.findMany({
        where: {
            organizationId,
            isApproved: true,
        },
        select: {
            rating: true,
        },
    });

    const totalReviews = reviews.length;
    const averageRating =
        totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;

    // Update organization
    return db.organization.update({
        where: { id: organizationId },
        data: {
            averageRating,
            totalReviews,
        },
    });
}
