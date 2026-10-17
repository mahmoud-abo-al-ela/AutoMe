// Onboarding session query functions
import { db } from "@/lib/prisma";

export async function findOnboardingSessionById(id: string) {
    return db.onboardingSession.findUnique({
        where: { id },
    });
}

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
