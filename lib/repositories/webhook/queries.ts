// Webhook repository - Data access layer for webhook-related queries
import { db } from "@/lib/prisma";

/**
 * Find organization by user ID (for webhook processing)
 */
export async function findOrganizationByUserId(userId: string) {
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
export async function findSubscriptionByStripeId(stripeSubscriptionId: string) {
    return db.subscription.findUnique({
        where: { stripeSubscriptionId },
    });
}

/**
 * Find subscription by organization ID
 */
export async function findSubscriptionByOrgId(organizationId: string) {
    return db.subscription.findUnique({
        where: { organizationId },
    });
}

/**
 * Find subscription by Stripe Checkout Session ID (for idempotency)
 */
export async function findSubscriptionByCheckoutSessionId(stripeCheckoutSessionId: string) {
    return db.subscription.findUnique({
        where: { stripeCheckoutSessionId },
        include: {
            organization: {
                select: { id: true, slug: true },
            },
        },
    });
}

/**
 * Whether a provider webhook event has already been processed.
 * For the atomic processing guard use `claimWebhookEvent` (mutations) instead;
 * this read is for diagnostics/observability.
 */
export async function hasProcessedEvent(eventId: string) {
    const existing = await db.webhookEvent.findUnique({
        where: { id: eventId },
        select: { id: true },
    });
    return existing !== null;
}
