// AI usage repository - Data access layer for AI usage mutations
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/**
 * Record a single AI provider call. Callers should await this inside try/catch —
 * never fire-and-forget, since a detached promise can be killed when the
 * serverless function returns.
 *
 * `data.organizationId` is nullable and is server-sourced, never from client
 * input. Failures should be recorded too (`success: false`, `errorCode`) — that
 * error rate is the repo's only telemetry.
 */
export async function createAiUsage(data: Prisma.AiUsageUncheckedCreateInput) {
    return db.aiUsage.create({ data });
}

/**
 * Stamp a just-saved car on the calls that led to it: this user's successful,
 * billable calls in this organization since `since` that no car has claimed
 * yet. A car saved without AI claims nothing and costs nothing; re-saving a
 * car already counted this month claims its new calls for the same car, so
 * the per-car count does not move.
 *
 * Scoped to the organization and the user, both server-sourced — one
 * dealer's photo read can never be charged to another's car.
 */
export async function attributeAiUsageToCar({
    organizationId,
    userId,
    carId,
    features,
    since,
}: {
    organizationId: string;
    userId: string;
    carId: string;
    features: string[];
    since: Date;
}) {
    return db.aiUsage.updateMany({
        where: {
            organizationId,
            userId,
            carId: null,
            success: true,
            feature: { in: features },
            createdAt: { gte: since },
        },
        data: { carId },
    });
}
