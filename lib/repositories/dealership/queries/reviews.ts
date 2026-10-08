// Dealership repository - review queries
import { db } from "@/lib/prisma";

export async function findDealershipReviews(
    organizationId: string,
    pagination: { page?: number; limit?: number } = {}
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
 * How many approved reviews gave each star rating — the breakdown counted
 * over all of a dealership's reviews, not just the page on screen.
 */
export async function countDealershipReviewsByRating(organizationId: string) {
    const rows = await db.dealershipReview.groupBy({
        by: ["rating"],
        where: { organizationId, isApproved: true },
        _count: { _all: true },
    });
    return rows.map((row) => ({ rating: row.rating, count: row._count._all }));
}

/**
 * Check if user has already reviewed a dealership
 */

export async function findUserReviewForDealership(
    organizationId: string,
    userId: string
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
