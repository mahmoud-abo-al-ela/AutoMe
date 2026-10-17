// AI usage repository - Data access layer for AI usage mutations
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

// Await inside try/catch, never fire-and-forget: a detached promise dies when the function returns.
export async function createAiUsage(data: Prisma.AiUsageUncheckedCreateInput) {
    return db.aiUsage.create({ data });
}

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
