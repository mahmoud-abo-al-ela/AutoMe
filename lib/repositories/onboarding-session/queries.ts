// Onboarding session query functions
import { db } from "@/lib/prisma";

/**
 * Find an onboarding session by ID
 * @param {string} id - The session ID
 * @returns {Promise<Object|null>} The onboarding session or null
 */
export async function findOnboardingSessionById(id: string) {
    return db.onboardingSession.findUnique({
        where: { id },
    });
}

/**
 * Find a pending onboarding session by user ID
 * Returns the most recent non-expired PENDING session
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The onboarding session or null
 */
export async function findPendingOnboardingSession(userId: string) {
    return db.onboardingSession.findFirst({
        where: {
            userId,
            status: "PENDING",
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Find an onboarding session by ID and verify it belongs to the user
 * @param {string} id - The session ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The onboarding session or null
 */
export async function findOnboardingSessionByIdAndUser(id: string, userId: string) {
    return db.onboardingSession.findFirst({
        where: {
            id,
            userId,
            status: "PENDING",
            expiresAt: { gt: new Date() },
        },
    });
}
