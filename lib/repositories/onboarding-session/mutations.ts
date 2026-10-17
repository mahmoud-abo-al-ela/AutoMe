// Onboarding session mutation functions
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

const SESSION_TTL_HOURS = 24;

export async function createOnboardingSession(userId: string, data: Prisma.InputJsonValue) {
    const expiresAt = new Date(
        Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000,
    );

    return db.onboardingSession.create({
        data: {
            userId,
            data,
            status: "PENDING",
            expiresAt,
        },
    });
}

export async function updateOnboardingSessionData(id: string, data: Prisma.InputJsonValue) {
    return db.onboardingSession.update({
        where: { id },
        data: { data },
    });
}

export async function markOnboardingSessionCompleted(id: string) {
    return db.onboardingSession.update({
        where: { id },
        data: { status: "COMPLETED" },
    });
}

export async function expirePendingSessionsForUser(userId: string) {
    return db.onboardingSession.updateMany({
        where: {
            userId,
            status: "PENDING",
        },
        data: { status: "EXPIRED" },
    });
}

/**
 * Delete expired onboarding sessions (cleanup)
 * @returns {Promise<Object>} Prisma batch delete result
 */
export async function deleteExpiredSessions() {
    return db.onboardingSession.deleteMany({
        where: {
            OR: [
                { status: "EXPIRED" },
                {
                    status: "PENDING",
                    expiresAt: { lt: new Date() },
                },
            ],
        },
    });
}
