// Dealership repository - mutations (data access layer)
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

export async function updateOrganizationProfile(
    organizationId: string,
    data: Prisma.OrganizationUncheckedUpdateInput,
) {
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

export async function createDealershipReview(data: {
    organizationId: string;
    userId: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
}) {
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

export async function updateDealershipRating(organizationId: string) {
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
