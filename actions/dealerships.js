"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as dealershipService from "@/lib/services/dealership";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling, withAuth } from "@/lib/middleware/with-auth";
import { ValidationError } from "@/lib/utils/errors";

/**
 * Get dealerships with filters and pagination
 */
export const getDealerships = withErrorHandling(async (filters = {}, pagination = {}) => {
    const result = await dealershipService.getDealerships(filters, pagination);
    return createSuccessResponse(result);
});

/**
 * Get dealership by slug
 */
export const getDealershipBySlug = withErrorHandling(async (slug) => {
    const dealership = await dealershipService.getDealershipBySlug(slug);
    return createSuccessResponse(dealership);
});

/**
 * Search dealerships
 */
export const searchDealerships = withErrorHandling(async (query, filters = {}, pagination = {}) => {
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
export const getDealershipFilters = withErrorHandling(async () => {
    const filters = await dealershipService.getDealershipFilters();
    return createSuccessResponse(filters);
});

/**
 * Get dealership cars
 */
export const getDealershipCars = withErrorHandling(async (organizationId, filters = {}, pagination = {}) => {
    const result = await dealershipService.getDealershipCars(
        organizationId,
        filters,
        pagination
    );
    return createSuccessResponse(result);
});

/**
 * Get dealership reviews
 */
export const getDealershipReviews = withErrorHandling(async (organizationId, pagination = {}) => {
    const result = await dealershipService.getDealershipReviews(
        organizationId,
        pagination
    );
    return createSuccessResponse(result);
});

/**
 * Create dealership review
 */
export const createDealershipReview = withAuth(async (ctx, organizationId, reviewData) => {
    const result = await dealershipService.createDealershipReview(
        organizationId,
        ctx.userId,
        reviewData
    );

    revalidatePath(`/dealerships/${organizationId}`);

    return createSuccessResponse(result, result.message);
});
