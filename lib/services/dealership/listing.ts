// Dealership listing service - Business logic layer
import * as dealershipRepo from "@/lib/repositories/dealership";
import { formatWorkingHours } from "@/lib/utils/working-hours";
import { DEFAULT_DEALERSHIP_SORT } from "@/lib/constants/dealership-options";
import type { PlanType } from "@/lib/generated/prisma";

/**
 * The dealership listing filter set. Declared here rather than in the
 * repository because lib/repositories/dealership/queries/listing.js is still
 * JavaScript (its where-builder is deferred); move this there on conversion.
 * Numeric bounds arrive as query-string values and are coerced below.
 */
export interface DealershipFilters {
    search?: string;
    planType?: PlanType;
    city?: string;
    region?: string;
    minRating?: string | number;
    maxRating?: string | number;
    minCarCount?: string | number;
    maxCarCount?: string | number;
    sort?: string;
}

export interface DealershipPagination {
    page?: number;
    limit?: number;
}

/**
 * The listing row this service reshapes. Only the fields read below are
 * declared; the repository still being JS means this is the contract between
 * the two until it converts.
 */
interface DealershipListRow {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    description: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    averageRating?: number | null;
    totalReviews?: number | null;
    carCount?: number | null;
    brands?: string[] | null;
    priceFrom?: number | null;
    workingHours?: Parameters<typeof formatWorkingHours>[0];
    subscription?: { plan?: { type?: PlanType; name?: string } | null } | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Get dealerships with filters and pagination
 */
export async function getDealerships(
    filters: DealershipFilters = {},
    pagination: DealershipPagination = {}
) {
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
        dealerships: result.dealerships.map((dealership: DealershipListRow) => ({
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
export async function searchDealerships(
    query: string | null | undefined,
    filters: DealershipFilters = {},
    pagination: DealershipPagination = {}
) {
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
export async function getDealershipFilters(filters: DealershipFilters = {}) {
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
