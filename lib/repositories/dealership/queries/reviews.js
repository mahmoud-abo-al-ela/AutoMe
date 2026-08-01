// Dealership repository - review queries
import { db } from "@/lib/prisma";

export async function findDealershipReviews(
    organizationId,
    pagination = {}
) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
        db.dealershipReview.findMany({
            where: {
                organizationId,
                isApproved: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),
        db.dealershipReview.count({
            where: {
                organizationId,
                isApproved: true,
            },
        }),
    ]);

    return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Check if user has already reviewed a dealership
 */

export async function findUserReviewForDealership(
    organizationId,
    userId
) {
    return db.dealershipReview.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
    });
}

/**
 * Create dealership review
 */
