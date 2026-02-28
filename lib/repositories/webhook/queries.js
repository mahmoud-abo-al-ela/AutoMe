// Webhook repository - Data access layer for webhook-related queries
import { db } from "@/lib/prisma";

/**
 * Find organization by user ID (for webhook processing)
 */
export async function findOrganizationByUserId(userId) {
    const membership = await db.membership.findFirst({
        where: {
            userId,
            role: "OWNER",
        },
        include: {
            organization: true,
        },
    });

    return membership?.organization || null;
}

/**
 * Find subscription by Stripe subscription ID
 */
export async function findSubscriptionByStripeId(stripeSubscriptionId) {
    return db.subscription.findUnique({
        where: { stripeSubscriptionId },
    });
}

/**
 * Find subscription by organization ID
 */
export async function findSubscriptionByOrgId(organizationId) {
    return db.subscription.findUnique({
        where: { organizationId },
    });
}

/**
 * Find subscription by Stripe Checkout Session ID (for idempotency)
 */
export async function findSubscriptionByCheckoutSessionId(stripeCheckoutSessionId) {
    return db.subscription.findUnique({
        where: { stripeCheckoutSessionId },
        include: {
            organization: {
                select: { id: true, slug: true },
            },
        },
    });
}
