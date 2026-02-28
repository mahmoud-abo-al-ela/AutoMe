// Onboarding session mutation functions
import { db } from "@/lib/prisma";

const SESSION_TTL_HOURS = 24;

/**
 * Create a new onboarding session
 * @param {string} userId - The user ID
 * @param {Object} data - The onboarding form data (JSON)
 * @returns {Promise<Object>} The created onboarding session
 */
export async function createOnboardingSession(userId, data) {
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

/**
 * Update an existing onboarding session's data
 * @param {string} id - The session ID
 * @param {Object} data - The updated onboarding form data (JSON)
 * @returns {Promise<Object>} The updated onboarding session
 */
export async function updateOnboardingSessionData(id, data) {
    return db.onboardingSession.update({
        where: { id },
        data: { data },
    });
}

/**
 * Mark an onboarding session as completed
 * @param {string} id - The session ID
 * @returns {Promise<Object>} The updated onboarding session
 */
export async function markOnboardingSessionCompleted(id) {
    return db.onboardingSession.update({
        where: { id },
        data: { status: "COMPLETED" },
    });
}

/**
 * Expire all pending sessions for a user (used when creating a new one)
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Prisma batch update result
 */
export async function expirePendingSessionsForUser(userId) {
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
