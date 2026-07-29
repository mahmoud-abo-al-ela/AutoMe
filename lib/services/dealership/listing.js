// Dealership listing service - Business logic layer
import * as dealershipRepo from "@/lib/repositories/dealership";
import { formatWorkingHours } from "@/lib/utils/working-hours";
import { DEFAULT_DEALERSHIP_SORT } from "@/lib/constants/dealership-options";

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
        sort = DEFAULT_DEALERSHIP_SORT,
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
        sort,
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
            brands: dealership.brands || [],
            priceFrom: dealership.priceFrom ?? null,
            workingHours: formatWorkingHours(dealership.workingHours),
            planType: dealership.subscription?.plan?.type || null,
            planName: dealership.subscription?.plan?.name || null,
            createdAt: dealership.createdAt,
            updatedAt: dealership.updatedAt,
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
 * Get available filter options.
 *
 * City/region facet counts are cross-filtered against the currently active
 * filters (so counts reflect what selecting them would return); platform stats
 * are global and independent of filters.
 */
export async function getDealershipFilters(filters = {}) {
    const [facets, stats] = await Promise.all([
        dealershipRepo.getDealershipFacetCounts(filters),
        dealershipRepo.getPlatformStats(),
    ]);

    return {
        cities: facets.cities,
        regions: facets.regions,
        stats,
    };
}
