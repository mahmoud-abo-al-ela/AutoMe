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

export type OnboardingSessionData = OrganizationInput & {
    billingPeriod?: "monthly" | "yearly";
};

function asSessionData(data: Prisma.JsonValue): OnboardingSessionData {
    return data as unknown as OnboardingSessionData;
}

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

export async function getOnboardingSession(
    sessionId: string
): Promise<OnboardingSessionData | null> {
    const session = await findOnboardingSessionById(sessionId);

    if (!session) return null;
    if (session.status !== "PENDING") return null;
    if (new Date(session.expiresAt) < new Date()) return null;

    return asSessionData(session.data);
}

export async function getOnboardingSessionForUser(
    sessionId: string,
    userId: string
): Promise<OnboardingSessionData | null> {
    const session = await findOnboardingSessionByIdAndUser(sessionId, userId);

    if (!session) return null;

    return asSessionData(session.data);
}

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

export async function markOnboardingSessionCompleted(sessionId: string): Promise<void> {
    await markCompleted(sessionId);
}

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
