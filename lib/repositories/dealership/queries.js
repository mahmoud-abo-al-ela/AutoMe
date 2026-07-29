// Dealership repository queries
import { db } from "@/lib/prisma";

// Shared include for the listing card: plan tier, working hours (for the
// "Open now" badge) and the two counts the card renders.
const LISTING_INCLUDE = {
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
};

/**
 * Build the base Prisma `where` for active dealerships plus the filters that
 * can be expressed directly on the Organization row. Car-count filters are
 * applied separately (they need the aggregated available-car count).
 */
function buildDealershipWhere({ search, city, region, planType, minRating, maxRating } = {}) {
    const where = {
        isActive: true,
        deletedAt: null,
    };

    if (search) {
        // Token-based match: every word must appear in at least one field (AND
        // across words, OR across fields). This makes multi-word queries like
        // "cairo gallery" match "Cairo Auto Gallery", which a single substring
        // `contains` on the whole phrase would miss.
        const SEARCH_FIELDS = ["name", "description", "address", "city", "region"];
        const tokens = search.split(/\s+/).map((t) => t.trim()).filter(Boolean);

        if (tokens.length > 0) {
            where.AND = tokens.map((token) => ({
                OR: SEARCH_FIELDS.map((field) => ({
                    [field]: { contains: token, mode: "insensitive" },
                })),
            }));
        }
    }

    if (city) {
        where.city = { equals: city, mode: "insensitive" };
    }

    if (region) {
        where.region = { equals: region, mode: "insensitive" };
    }

    if (planType) {
        where.subscription = { plan: { type: planType } };
    }

    if (minRating !== undefined || maxRating !== undefined) {
        where.averageRating = {};
        if (minRating !== undefined) where.averageRating.gte = minRating;
        if (maxRating !== undefined) where.averageRating.lte = maxRating;
    }

    return where;
}

// Prisma orderBy for the sorts that don't depend on the relation count.
function buildDealershipOrderBy(sort) {
    switch (sort) {
        case "mostReviewed":
            return [{ totalReviews: "desc" }, { averageRating: "desc" }, { name: "asc" }];
        case "newest":
            return [{ createdAt: "desc" }];
        case "nameAsc":
            return [{ name: "asc" }];
        case "rating":
        default:
            return [{ averageRating: "desc" }, { totalReviews: "desc" }, { name: "asc" }];
    }
}

// In-memory comparator for the count-aggregation path (sorting by available
// car count can't be expressed as a Prisma orderBy on a filtered relation).
function buildRankComparator(sort) {
    switch (sort) {
        case "mostCars":
            return (a, b) => b.count - a.count || a.name.localeCompare(b.name);
        case "mostReviewed":
            return (a, b) =>
                b.totalReviews - a.totalReviews ||
                b.averageRating - a.averageRating ||
                a.name.localeCompare(b.name);
        case "newest":
            return (a, b) => b.createdAt - a.createdAt;
        case "nameAsc":
            return (a, b) => a.name.localeCompare(b.name);
        case "rating":
        default:
            return (a, b) =>
                b.averageRating - a.averageRating ||
                b.totalReviews - a.totalReviews ||
                a.name.localeCompare(b.name);
    }
}

/**
 * Attach the derived fields the listing card needs but that aren't columns:
 * available car count, approved review count, top brands carried, and the
 * lowest available price. Runs one groupBy per concern over the page's org ids.
 */
async function enrichDealerships(dealerships) {
    if (dealerships.length === 0) return [];

    const ids = dealerships.map((d) => d.id);

    const [brandRows, priceRows] = await Promise.all([
        db.car.groupBy({
            by: ["organizationId", "make"],
            where: { organizationId: { in: ids }, status: "AVAILABLE" },
            _count: { _all: true },
        }),
        db.car.groupBy({
            by: ["organizationId"],
            where: { organizationId: { in: ids }, status: "AVAILABLE" },
            _min: { price: true },
        }),
    ]);

    const brandsByOrg = new Map();
    for (const row of brandRows) {
        const list = brandsByOrg.get(row.organizationId) || [];
        list.push({ make: row.make, count: row._count._all });
        brandsByOrg.set(row.organizationId, list);
    }

    const priceByOrg = new Map(
        priceRows.map((r) => [
            r.organizationId,
            r._min.price != null ? parseFloat(r._min.price.toString()) : null,
        ])
    );

    return dealerships.map((dealership) => ({
        ...dealership,
        carCount: dealership._count.cars,
        reviewCount: dealership._count.dealershipReviews,
        brands: (brandsByOrg.get(dealership.id) || [])
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map((b) => b.make),
        priceFrom: priceByOrg.get(dealership.id) ?? null,
        _count: undefined,
    }));
}

/**
 * Find dealerships with filters and pagination.
 *
 * `sort` is a single flat enum: rating | mostCars | mostReviewed | newest | nameAsc.
 * When sorting by mostCars or filtering by car count, we can't express the
 * ordering/predicate as a Prisma orderBy/where on a filtered relation, so we
 * fetch the matching ids with their available-car counts and rank/paginate in
 * memory (dealership counts are small), then hydrate the page.
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
        sort = "rating",
    } = filters;

    const { page = 1, limit = 12 } = pagination;
    const skip = (page - 1) * limit;

    const where = buildDealershipWhere({ search, city, region, planType, minRating, maxRating });

    const needsCountPath =
        sort === "mostCars" || minCarCount !== undefined || maxCarCount !== undefined;

    let dealerships;
    let total;

    if (needsCountPath) {
        const rows = await db.organization.findMany({
            where,
            select: {
                id: true,
                name: true,
                averageRating: true,
                totalReviews: true,
                createdAt: true,
                _count: { select: { cars: { where: { status: "AVAILABLE" } } } },
            },
        });

        let ranked = rows.map((r) => ({
            id: r.id,
            name: r.name,
            averageRating: r.averageRating,
            totalReviews: r.totalReviews,
            createdAt: r.createdAt,
            count: r._count.cars,
        }));

        if (minCarCount !== undefined) ranked = ranked.filter((r) => r.count >= minCarCount);
        if (maxCarCount !== undefined) ranked = ranked.filter((r) => r.count <= maxCarCount);

        ranked.sort(buildRankComparator(sort));

        total = ranked.length;
        const pageIds = ranked.slice(skip, skip + limit).map((r) => r.id);

        const fetched = await db.organization.findMany({
            where: { id: { in: pageIds } },
            include: LISTING_INCLUDE,
        });
        const byId = new Map(fetched.map((d) => [d.id, d]));
        dealerships = pageIds.map((id) => byId.get(id)).filter(Boolean);
    } else {
        [dealerships, total] = await Promise.all([
            db.organization.findMany({
                where,
                include: LISTING_INCLUDE,
                orderBy: buildDealershipOrderBy(sort),
                skip,
                take: limit,
            }),
            db.organization.count({ where }),
        ]);
    }

    const enriched = await enrichDealerships(dealerships);

    return {
        dealerships: enriched,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Facet counts for the city/region filters, cross-filtered against the other
 * active filters (a city's count excludes the city filter itself so you can
 * still switch cities). Mirrors the cars page's facet behaviour.
 */
export async function getDealershipFacetCounts(filters = {}) {
    const { search, city, region, minRating, maxRating } = filters;

    const cityWhere = buildDealershipWhere({ search, region, minRating, maxRating });
    cityWhere.city = { not: null };

    const regionWhere = buildDealershipWhere({ search, city, minRating, maxRating });
    regionWhere.region = { not: null };

    const [cityGroups, regionGroups] = await Promise.all([
        db.organization.groupBy({ by: ["city"], where: cityWhere, _count: { _all: true } }),
        db.organization.groupBy({ by: ["region"], where: regionWhere, _count: { _all: true } }),
    ]);

    return {
        cities: cityGroups
            .map((g) => ({ value: g.city, count: g._count._all }))
            .filter((c) => c.value)
            .sort((a, b) => a.value.localeCompare(b.value)),
        regions: regionGroups
            .map((g) => ({ value: g.region, count: g._count._all }))
            .filter((r) => r.value)
            .sort((a, b) => a.value.localeCompare(b.value)),
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
        // Token-based match: every word must appear in at least one field (AND
        // across words, OR across fields). This makes multi-word queries like
        // "cairo gallery" match "Cairo Auto Gallery", which a single substring
        // `contains` on the whole phrase would miss.
        const SEARCH_FIELDS = ["name", "description", "address", "city", "region"];
        const tokens = search.split(/\s+/).map((t) => t.trim()).filter(Boolean);

        if (tokens.length > 0) {
            where.AND = tokens.map((token) => ({
                OR: SEARCH_FIELDS.map((field) => ({
                    [field]: { contains: token, mode: "insensitive" },
                })),
            }));
        }
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
