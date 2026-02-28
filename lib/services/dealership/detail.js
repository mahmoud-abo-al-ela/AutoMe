// Dealership detail service - Business logic layer
import * as dealershipRepo from "@/lib/repositories/dealership";
import { serializeCars } from "@/lib/utils/serializers";
import { AuthenticationError, ValidationError } from "@/lib/utils/errors";

/**
 * Get dealership by slug with full details
 */
export async function getDealershipBySlug(slug) {
    if (!slug || slug.trim().length === 0) {
        throw new ValidationError("Slug is required", "slug");
    }

    const dealership = await dealershipRepo.findDealershipBySlug(slug.trim());

    if (!dealership) {
        throw new ValidationError("Dealership not found", "slug");
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
        phone: dealership.phone,
        email: dealership.email,
        website: dealership.website,
        averageRating: dealership.averageRating || 0,
        totalReviews: dealership.totalReviews || 0,
        carCount: dealership.carCount || 0,
        planType: dealership.subscription?.plan?.type || null,
        planName: dealership.subscription?.plan?.name || null,
        workingHours: formattedWorkingHours,
        createdAt: dealership.createdAt,
        updatedAt: dealership.updatedAt,
    };
}

/**
 * Get dealership cars with pagination
 */
export async function getDealershipCars(
    organizationId,
    filters = {},
    pagination = {}
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
 * Get dealership reviews with pagination
 */
export async function getDealershipReviews(
    organizationId,
    pagination = {}
) {
    if (!organizationId) {
        throw new ValidationError("Organization ID is required", "organizationId");
    }

    const result = await dealershipRepo.findDealershipReviews(
        organizationId,
        pagination
    );

    return {
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
    organizationId,
    userId,
    reviewData
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
        throw new ValidationError("Rating must be between 1 and 5", "rating");
    }

    // Check if user has already reviewed this dealership
    const existingReview = await dealershipRepo.findUserReviewForDealership(
        organizationId,
        userId
    );

    if (existingReview) {
        throw new ValidationError(
            "You have already reviewed this dealership",
            "review"
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

/**
 * Format working hours for display
 */
function formatWorkingHours(workingHours) {
    if (!workingHours || workingHours.length === 0) {
        return [];
    }

    const dayOrder = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
    ];

    const dayNames = {
        MONDAY: "Monday",
        TUESDAY: "Tuesday",
        WEDNESDAY: "Wednesday",
        THURSDAY: "Thursday",
        FRIDAY: "Friday",
        SATURDAY: "Saturday",
        SUNDAY: "Sunday",
    };

    return workingHours
        .sort((a, b) => {
            const aIndex = dayOrder.indexOf(a.dayOfWeek[0]);
            const bIndex = dayOrder.indexOf(b.dayOfWeek[0]);
            return aIndex - bIndex;
        })
        .map((wh) => ({
            day: dayNames[wh.dayOfWeek[0]] || wh.dayOfWeek[0],
            openTime: wh.openTime,
            closeTime: wh.closeTime,
            isOpen: wh.isOpen,
        }));
}
