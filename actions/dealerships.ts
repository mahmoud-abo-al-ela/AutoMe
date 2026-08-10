"use server";


import { revalidatePath } from "next/cache";
import * as dealershipService from "@/lib/services/dealership";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling, withAuth } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { dealershipReviewSchema } from "@/lib/validations/schemas";
import { ValidationError } from "@/lib/utils/errors";
import type {
    DealershipFilters,
    DealershipPagination,
} from "@/lib/services/dealership/listing";
import type { CarFilters, CarPagination } from "@/lib/services/car/listing";

/**
 * Get dealerships with filters and pagination
 */
export const getDealerships = withErrorHandling(
    async (filters: DealershipFilters = {}, pagination: DealershipPagination = {}) => {
    const result = await dealershipService.getDealerships(filters, pagination);
    return createSuccessResponse(result);
});

/**
 * Get dealership by slug
 */
export const getDealershipBySlug = withErrorHandling(async (slug: string) => {
    const dealership = await dealershipService.getDealershipBySlug(slug);
    return createSuccessResponse(dealership);
});

/**
 * Search dealerships
 */
export const searchDealerships = withErrorHandling(
    async (
        query: string,
        filters: DealershipFilters = {},
        pagination: DealershipPagination = {}
    ) => {
    const result = await dealershipService.searchDealerships(
        query,
        filters,
        pagination
    );
    return createSuccessResponse(result);
});

/**
 * Get dealership filters
 */
export const getDealershipFilters = withErrorHandling(
    async (filters: DealershipFilters = {}) => {
    const options = await dealershipService.getDealershipFilters(filters);
    return createSuccessResponse(options);
});

/**
 * Get dealership cars
 */
export const getDealershipCars = withErrorHandling(
    async (
        organizationId: string,
        filters: CarFilters = {},
        pagination: CarPagination = {}
    ) => {
    const result = await dealershipService.getDealershipCars(
        organizationId,
        filters,
        pagination
    );
    return createSuccessResponse(result);
});

/**
 * Get filter options for a dealership's cars
 */
export const getDealershipCarFilters = withErrorHandling(
    async (organizationId: string) => {
    const filters = await dealershipService.getDealershipCarFilters(organizationId);
    return createSuccessResponse(filters);
});

/**
 * Get dealership reviews
 */
export const getDealershipReviews = withErrorHandling(
    async (organizationId: string, pagination: { page?: number; limit?: number } = {}) => {
    const result = await dealershipService.getDealershipReviews(
        organizationId,
        pagination
    );
    return createSuccessResponse(result);
});

/**
 * Create dealership review
 */
export const createDealershipReview = withAuth(
    async (ctx, organizationId: string, reviewData: unknown) => {
    await enforceRateLimit();
    const validatedReview = validateAction(dealershipReviewSchema, reviewData);

    const result = await dealershipService.createDealershipReview(
        organizationId,
        ctx.userId,
        validatedReview
    );

    revalidatePath(`/dealerships/${organizationId}`);

    return createSuccessResponse(result, result.message);
});
