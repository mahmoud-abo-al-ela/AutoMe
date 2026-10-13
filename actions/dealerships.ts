"use server";


import { revalidateRouteTree } from "@/lib/utils/revalidate";
import * as dealershipService from "@/lib/services/dealership";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling, withAuth } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import {
    dealershipCarFiltersSchema,
    dealershipListFiltersSchema,
    dealershipListPageSchema,
    type DealershipListFiltersInput,
    type DealershipListPageInput,
    dealershipReviewSchema,
    dealershipSlugSchema,
    publicPageSchema,
    type DealershipCarFiltersInput,
    type PublicPageInput,
} from "@/lib/validations/schemas";
import { ValidationError } from "@/lib/utils/errors";
import { assertBuyerAllowed } from "@/lib/auth/assert-buyer";

/**
 * The public dealerships list. Filters and page size are reduced to what the
 * list page can set (dealershipListFiltersSchema) — no plan filter, at most 48
 * per page.
 */
export const getDealerships = withErrorHandling(
    async (filters: DealershipListFiltersInput = {}, pagination: DealershipListPageInput = {}) => {
    const result = await dealershipService.getDealerships(
        validateAction(dealershipListFiltersSchema, filters),
        validateAction(dealershipListPageSchema, pagination)
    );
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
        filters: DealershipListFiltersInput = {},
        pagination: DealershipListPageInput = {}
    ) => {
    const result = await dealershipService.searchDealerships(
        validateAction(dealershipListFiltersSchema, { search: query }).search,
        validateAction(dealershipListFiltersSchema, filters),
        validateAction(dealershipListPageSchema, pagination)
    );
    return createSuccessResponse(result);
});

/**
 * Get dealership filters
 */
export const getDealershipFilters = withErrorHandling(
    async (filters: DealershipListFiltersInput = {}) => {
    const options = await dealershipService.getDealershipFilters(validateAction(dealershipListFiltersSchema, filters));
    return createSuccessResponse(options);
});

/**
 * A public dealership's cars on sale, one page at a time. The dealership is
 * named by slug and resolved here to one the public may see; filters and the
 * page size are validated, so a request cannot ask for another scope or for
 * every car at once.
 */
export const getDealershipCars = withErrorHandling(
    async (slug: string, filters: DealershipCarFiltersInput = {}, pagination: PublicPageInput = {}) => {
    const organizationId = await dealershipService.resolvePublicDealershipId(validateAction(dealershipSlugSchema, slug));
    const result = await dealershipService.getDealershipCars(
        organizationId,
        validateAction(dealershipCarFiltersSchema, filters),
        validateAction(publicPageSchema, pagination)
    );
    return createSuccessResponse(result);
});

/** Filter options over a public dealership's cars on sale. */
export const getDealershipCarFilters = withErrorHandling(async (slug: string) => {
    const organizationId = await dealershipService.resolvePublicDealershipId(validateAction(dealershipSlugSchema, slug));
    const filters = await dealershipService.getDealershipCarFilters(organizationId);
    return createSuccessResponse(filters);
});

/** A public dealership's approved reviews, one page at a time. */
export const getDealershipReviews = withErrorHandling(
    async (slug: string, pagination: PublicPageInput = {}) => {
    const organizationId = await dealershipService.resolvePublicDealershipId(validateAction(dealershipSlugSchema, slug));
    const result = await dealershipService.getDealershipReviews(organizationId, validateAction(publicPageSchema, pagination));
    return createSuccessResponse(result);
});

/**
 * Create dealership review
 */
export const createDealershipReview = withAuth(
    async (ctx, organizationId: string, reviewData: unknown) => {
    await enforceRateLimit();
    const validatedReview = validateAction(dealershipReviewSchema, reviewData);
    // The client names the dealership being reviewed, not the caller's own;
    // the check compares it with the caller's memberships, read server side.
    assertBuyerAllowed(ctx.user, organizationId, "review");

    const result = await dealershipService.createDealershipReview(
        organizationId,
        ctx.userId,
        validatedReview
    );

    // The detail page is keyed by slug, which this action does not have; the
    // listing shows the rating too.
    revalidateRouteTree("/[locale]/(site)/dealerships");

    return createSuccessResponse(result, result.message);
});
