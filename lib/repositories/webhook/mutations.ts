// Webhook repository - Data access layer for webhook-related mutations
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/**
 * Create a new subscription
 */
export async function createSubscription(data: Prisma.SubscriptionUncheckedCreateInput) {
    return db.subscription.create({
        data,
    });
}

/**
 * Update subscription by organization ID
 */
export async function updateSubscriptionByOrgId(
    organizationId: string,
    data: Prisma.SubscriptionUncheckedUpdateInput,
) {
    return db.subscription.update({
        where: { organizationId },
        data,
    });
}

/**
 * Update subscription by ID
 */
export async function updateSubscriptionById(
    subscriptionId: string,
    data: Prisma.SubscriptionUncheckedUpdateInput,
) {
    return db.subscription.update({
        where: { id: subscriptionId },
        data,
    });
}

/**
 * Upsert subscription (create or update)
 */
export async function upsertSubscription(
    organizationId: string,
    data: Prisma.SubscriptionUncheckedCreateInput,
) {
    return db.subscription.upsert({
        where: { organizationId },
        create: data,
        update: data,
    });
}

/**
 * Atomically claim a webhook event for processing (idempotency guard).
 *
 * Inserts a WebhookEvent row keyed by the provider's own event id. Because the id
 * is the primary key, a duplicate delivery collides and is skipped. Returns `true`
 * only for the caller that won the insert — every retry/duplicate gets `false`.
 * This is race-safe under concurrent deliveries (unlike a check-then-act read).
 */
export async function claimWebhookEvent({ id, provider, type }: { id: string; provider: string; type: string }) {
    const { count } = await db.webhookEvent.createMany({
        data: [{ id, provider, type }],
        skipDuplicates: true,
    });
    return count === 1;
}

/**
 * Release a previously-claimed webhook event so the provider's retry can
 * re-process it. Call this when handling failed *after* the claim — otherwise
 * the failed event would be permanently skipped as a "duplicate".
 */
export async function releaseWebhookEvent(id: string) {
    await db.webhookEvent.deleteMany({ where: { id } });
}
