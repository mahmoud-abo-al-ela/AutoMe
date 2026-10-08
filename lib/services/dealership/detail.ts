// Dealership detail service - Business logic layer
import * as dealershipRepo from "@/lib/repositories/dealership";
import { serializeCars } from "@/lib/utils/serializers";
import { AuthenticationError, NotFoundError, ValidationError } from "@/lib/utils/errors";
import { formatWorkingHours } from "@/lib/utils/working-hours";
import type { CarFilters, CarPagination } from "@/lib/services/car/listing";
import type { DealershipReviewInput } from "@/lib/validations/schemas";

/**
 * Get dealership by slug with full details
 */
export async function getDealershipBySlug(slug: string | null | undefined) {
    if (!slug || slug.trim().length === 0) {
        throw new ValidationError("Slug is required", "slug");
    }

    const dealership = await dealershipRepo.findDealershipBySlug(slug.trim());

    if (!dealership) {
        throw new NotFoundError("Dealership");
    }

    // Format working hours
    const formattedWorkingHours = formatWorkingHours(dealership.workingHours);

    return {
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
        workingHours: formattedWorkingHours,
        // The standing terms buyers read on every listing (null = not stated).
        offersFinancing: dealership.offersFinancing,
        financingNote: dealership.financingNote,
        acceptsTradeIn: dealership.acceptsTradeIn,
        allowsInspection: dealership.allowsInspection,
        offersDelivery: dealership.offersDelivery,
        createdAt: dealership.createdAt,
        updatedAt: dealership.updatedAt,
    };
}

/**
 * Get dealership cars with pagination
 */
export async function getDealershipCars(
    organizationId: string,
    filters: CarFilters = {},
    pagination: CarPagination = {}
) {
    if (!organizationId) {
        throw new ValidationError("Organization ID is required", "organizationId");
    }

    const result = await dealershipRepo.findDealershipCars(
        organizationId,
        filters,
        pagination
    );

    return {
        cars: serializeCars(result.cars),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    };
}

/**
 * Get dealership car filters options
 */
export async function getDealershipCarFilters(organizationId: string) {
    if (!organizationId) {
        throw new ValidationError("Organization ID is required", "organizationId");
    }

    const filters = await dealershipRepo.getDealershipCarFilterOptions(organizationId);
    return filters;
}

/**
 * Get dealership reviews with pagination
 */
export async function getDealershipReviews(
    organizationId: string,
    pagination: { page?: number; limit?: number } = {}
) {
    if (!organizationId) {
        throw new ValidationError("Organization ID is required", "organizationId");
    }

    const [result, ratingRows] = await Promise.all([
        dealershipRepo.findDealershipReviews(organizationId, pagination),
        dealershipRepo.countDealershipReviewsByRating(organizationId),
    ]);

    return {
        // Five stars first, every rating present (0 when none gave it).
        ratingCounts: [5, 4, 3, 2, 1].map((rating) => ({
            rating,
            count: ratingRows.find((row) => row.rating === rating)?.count ?? 0,
        })),
        reviews: result.reviews.map((review) => ({
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            user: {
                id: review.user.id,
                name: review.user.name || "Anonymous",
                imageUrl: review.user.imageUrl,
            },
        })),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    };
}

/**
 * Create dealership review
 */
export async function createDealershipReview(
    organizationId: string,
    userId: string,
    reviewData: DealershipReviewInput
) {
    if (!organizationId) {
        throw new ValidationError("Organization ID is required", "organizationId");
    }

    if (!userId) {
        throw new AuthenticationError("User must be authenticated");
    }

    const { rating, title, comment } = reviewData;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        throw new ValidationError("Rating must be between 1 and 5", "rating", { key: "errors.review.invalidRating", params: { min: 1, max: 5 } });
    }

    // Check if user has already reviewed this dealership
    const existingReview = await dealershipRepo.findUserReviewForDealership(
        organizationId,
        userId
    );

    if (existingReview) {
        throw new ValidationError(
            "You have already reviewed this dealership",
            "review",
            { key: "errors.review.alreadyReviewed" }
        );
    }

    // Create review
    await dealershipRepo.createDealershipReview({
        organizationId,
        userId,
        rating,
        title: title?.trim() || null,
        comment: comment?.trim() || null,
    });

    // Update dealership average rating
    await dealershipRepo.updateDealershipRating(organizationId);

    return {
        success: true,
        message:
            "Review submitted successfully. It will be visible after approval.",
    };
}

