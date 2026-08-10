// Onboarding session service - Business logic layer
import {
    findOnboardingSessionById,
    findPendingOnboardingSession,
    findOnboardingSessionByIdAndUser,
    createOnboardingSession as createSession,
    updateOnboardingSessionData,
    markOnboardingSessionCompleted as markCompleted,
    expirePendingSessionsForUser,
} from "@/lib/repositories/onboarding-session";
import type { Prisma } from "@/lib/generated/prisma";
import type { OrganizationInput } from "@/lib/validations/schemas";

/**
 * What the onboarding form stores in OnboardingSession.data. Prisma types the
 * column as opaque JSON, so the read helpers below assert this shape once, at
 * the boundary, rather than leaving every consumer to guess at it.
 */
export type OnboardingSessionData = OrganizationInput & {
    billingPeriod?: "monthly" | "yearly";
};

function asSessionData(data: Prisma.JsonValue): OnboardingSessionData {
    return data as unknown as OnboardingSessionData;
}

/**
 * Save onboarding form data to a session.
 * Expires any existing pending sessions for the user, then creates a new one.
 *
 * @param {string} userId - The authenticated user's ID
 * @param {Object} formData - The full onboarding form data (org details, working hours, plan selection)
 * @returns {Promise<{ sessionId: string }>} The created session ID
 */
export async function saveOnboardingSession(
    userId: string,
    formData: OnboardingSessionData
): Promise<{ sessionId: string }> {
    // Expire any previous pending sessions for this user
    await expirePendingSessionsForUser(userId);

    // Create a fresh session
    const session = await createSession(userId, formData);

    return { sessionId: session.id };
}

/**
 * Retrieve onboarding session data by session ID.
 * Validates that the session exists, is PENDING, and has not expired.
 *
 * @param {string} sessionId - The onboarding session ID
 * @returns {Promise<Object|null>} The session data (JSON) or null if invalid/expired
 */
export async function getOnboardingSession(
    sessionId: string
): Promise<OnboardingSessionData | null> {
    const session = await findOnboardingSessionById(sessionId);

    if (!session) return null;
    if (session.status !== "PENDING") return null;
    if (new Date(session.expiresAt) < new Date()) return null;

    return asSessionData(session.data);
}

/**
 * Retrieve onboarding session data, verifying ownership.
 * Used by the success page to ensure the session belongs to the authenticated user.
 *
 * @param {string} sessionId - The onboarding session ID
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object|null>} The session data (JSON) or null if invalid
 */
export async function getOnboardingSessionForUser(
    sessionId: string,
    userId: string
): Promise<OnboardingSessionData | null> {
    const session = await findOnboardingSessionByIdAndUser(sessionId, userId);

    if (!session) return null;

    return asSessionData(session.data);
}

/**
 * Update an existing onboarding session with new form data.
 * Used when the user navigates back and changes data before checkout.
 *
 * @param {string} sessionId - The onboarding session ID
 * @param {string} userId - The authenticated user's ID
 * @param {Object} formData - The updated form data
 * @returns {Promise<{ sessionId: string }|null>} The session ID or null if not found
 */
export async function updateOnboardingSession(
    sessionId: string,
    userId: string,
    formData: OnboardingSessionData
): Promise<{ sessionId: string } | null> {
    // Verify the session belongs to this user and is still valid
    const session = await findOnboardingSessionByIdAndUser(sessionId, userId);

    if (!session) return null;

    await updateOnboardingSessionData(session.id, formData);

    return { sessionId: session.id };
}

/**
 * Mark an onboarding session as completed.
 * Called after the organization has been successfully created.
 *
 * @param {string} sessionId - The onboarding session ID
 * @returns {Promise<void>}
 */
export async function markOnboardingSessionCompleted(sessionId: string): Promise<void> {
    await markCompleted(sessionId);
}

/**
 * Get or resume a pending onboarding session for a user.
 * Used when the user returns to the onboarding page (e.g., after cancelling Stripe Checkout).
 *
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<{ sessionId: string, data: Object }|null>} The session or null
 */
export async function resumeOnboardingSession(
    userId: string
): Promise<{ sessionId: string; data: OnboardingSessionData } | null> {
    const session = await findPendingOnboardingSession(userId);

    if (!session) return null;

    return {
        sessionId: session.id,
        data: asSessionData(session.data),
    };
}
