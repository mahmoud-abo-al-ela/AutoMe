"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as dealershipService from "@/lib/services/dealership";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/response";
import { AuthenticationError, ValidationError } from "@/lib/utils/errors";

/**
 * Get dealerships with filters and pagination
 */
export async function getDealerships(filters = {}, pagination = {}) {
    try {
        const result = await dealershipService.getDealerships(filters, pagination);

        return createSuccessResponse(result);
    } catch (error) {
        console.error("Error fetching dealerships", error);
        return createErrorResponse(error);
    }
}

/**
 * Get dealership by slug
 */
export async function getDealershipBySlug(slug) {
    try {
        const dealership = await dealershipService.getDealershipBySlug(slug);

        return createSuccessResponse(dealership);
    } catch (error) {
        console.error("Error fetching dealership by slug", error);
        return createErrorResponse(error);
    }
}

/**
 * Search dealerships
 */
export async function searchDealerships(query, filters = {}, pagination = {}) {
    try {
        const result = await dealershipService.searchDealerships(
            query,
            filters,
            pagination
        );

        return createSuccessResponse(result);
    } catch (error) {
        console.error("Error searching dealerships", error);
        return createErrorResponse(error);
    }
}

/**
 * Get dealership filters
 */
export async function getDealershipFilters() {
    try {
        const filters = await dealershipService.getDealershipFilters();

        return createSuccessResponse(filters);
    } catch (error) {
        console.error("Error fetching dealership filters", error);
        return createErrorResponse(error);
    }
}

/**
 * Get dealership cars
 */
export async function getDealershipCars(organizationId, filters = {}, pagination = {}) {
    try {
        const result = await dealershipService.getDealershipCars(
            organizationId,
            filters,
            pagination
        );

        return createSuccessResponse(result);
    } catch (error) {
        console.error("Error fetching dealership cars", error);
        return createErrorResponse(error);
    }
}

/**
 * Get dealership reviews
 */
export async function getDealershipReviews(organizationId, pagination = {}) {
    try {
        const result = await dealershipService.getDealershipReviews(
            organizationId,
            pagination
        );

        return createSuccessResponse(result);
    } catch (error) {
        console.error("Error fetching dealership reviews", error);
        return createErrorResponse(error);
    }
}

/**
 * Create dealership review
 */
export async function createDealershipReview(organizationId, reviewData) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new AuthenticationError();
        }

        const result = await dealershipService.createDealershipReview(
            organizationId,
            userId,
            reviewData
        );

        revalidatePath(`/dealerships/${organizationId}`);

        return createSuccessResponse(result, result.message);
    } catch (error) {
        console.error("Error creating dealership review", error);
        return createErrorResponse(error);
    }
}
