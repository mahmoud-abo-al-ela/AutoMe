// Webhook repository - Data access layer for webhook-related mutations
import { db } from "@/lib/prisma";

/**
 * Create a new subscription
 */
export async function createSubscription(data) {
    return db.subscription.create({
        data,
    });
}

/**
 * Update subscription by organization ID
 */
export async function updateSubscriptionByOrgId(organizationId, data) {
    return db.subscription.update({
        where: { organizationId },
        data,
    });
}

/**
 * Update subscription by ID
 */
export async function updateSubscriptionById(subscriptionId, data) {
    return db.subscription.update({
        where: { id: subscriptionId },
        data,
    });
}

/**
 * Upsert subscription (create or update)
 */
export async function upsertSubscription(organizationId, data) {
    return db.subscription.upsert({
        where: { organizationId },
        create: data,
        update: data,
    });
}
