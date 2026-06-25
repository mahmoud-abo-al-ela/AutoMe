// Dealership listing service - Business logic layer
import * as dealershipRepo from "@/lib/repositories/dealership";

/**
 * Get dealerships with filters and pagination
 */
export async function getDealerships(filters = {}, pagination = {}) {
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

    // Apply default filters
    const appliedFilters = {
        search: search?.trim(),
        planType,
        city: city?.trim(),
        region: region?.trim(),
        minRating: minRating !== undefined ? Number(minRating) : undefined,
        maxRating: maxRating !== undefined ? Number(maxRating) : undefined,
        minCarCount: minCarCount !== undefined ? Number(minCarCount) : undefined,
        maxCarCount: maxCarCount !== undefined ? Number(maxCarCount) : undefined,
        sortBy,
        sortOrder,
    };

    // Fetch dealerships from repository
    const result = await dealershipRepo.findDealerships(
        appliedFilters,
        pagination
    );

    // Format response
    return {
        dealerships: result.dealerships.map((dealership) => ({
            id: dealership.id,
            name: dealership.name,
            slug: dealership.slug,
            logo: dealership.logo,
            description: dealership.description,
            address: dealership.address,
            city: dealership.city,
            region: dealership.region,
            country: dealership.country,
            phone: dealership.phone,
            email: dealership.email,
            website: dealership.website,
            averageRating: dealership.averageRating || 0,
            totalReviews: dealership.totalReviews || 0,
            carCount: dealership.carCount || 0,
            planType: dealership.subscription?.plan?.type || null,
            planName: dealership.subscription?.plan?.name || null,
            createdAt: dealership.createdAt,
        })),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
        filters: appliedFilters,
    };
}

/**
 * Search dealerships with query
 */
export async function searchDealerships(query, filters = {}, pagination = {}) {
    if (!query || query.trim().length === 0) {
        return getDealerships(filters, pagination);
    }

    return getDealerships(
        {
            ...filters,
            search: query.trim(),
        },
        pagination
    );
}

/**
 * Get available filter options
 */
export async function getDealershipFilters() {
    const [locations, stats] = await Promise.all([
        dealershipRepo.getDealershipDistinctLocations(),
        dealershipRepo.getPlatformStats(),
    ]);

    return {
        cities: locations.cities,
        regions: locations.regions,
        stats,
        ratingRanges: [
            { label: "5 Stars", value: 5 },
            { label: "4+ Stars", value: 4 },
            { label: "3+ Stars", value: 3 },
            { label: "2+ Stars", value: 2 },
            { label: "1+ Stars", value: 1 },
        ],
        sortByOptions: [
            { label: "Highest Rated", value: "rating" },
            { label: "Most Cars", value: "carCount" },
            { label: "Newest", value: "newest" },
            { label: "Name (A-Z)", value: "name" },
        ],
    };
}
