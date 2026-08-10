// Stripe subscription event handlers
import type Stripe from "stripe";
import type { SubscriptionStatus } from "@/lib/generated/prisma";
import * as webhookRepo from "@/lib/repositories/webhook";

/**
 * The slice of a Stripe.Event these handlers actually read. Typed structurally
 * so the (still-JS) webhook route can keep passing a whole Stripe.Event.
 */
export type StripeEventOf<T> = { data: { object: T } };

/**
 * Result shape shared by every handler in this cluster: a success with the
 * entity it touched, or a refusal carrying the reason the route logs.
 */
export type WebhookHandlerResult =
    | { success: true; organizationId?: string; subscriptionId?: string; reason?: string; activated?: boolean }
    | { success: false; reason: string };

/**
 * The billing period moved from Subscription onto its items in the 2025 Basil
 * API release. Every item on a given subscription shares the same period, so
 * the first one is representative. Verified against a live subscription:
 * sub.current_period_start is undefined, items.data[0].current_period_start is
 * the timestamp.
 */
function billingPeriodOf(subscription: Stripe.Subscription): {
    start: Date | null;
    end: Date | null;
} {
    const item = subscription.items?.data?.[0];
    return {
        start: item ? new Date(item.current_period_start * 1000) : null,
        end: item ? new Date(item.current_period_end * 1000) : null,
    };
}

export function mapStripeStatusToSubscriptionStatus(
    stripeStatus: Stripe.Subscription.Status | string
): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
        active: "ACTIVE",
        past_due: "PAST_DUE",
        canceled: "CANCELED",
        trialing: "TRIALING",
        incomplete: "PENDING",
        incomplete_expired: "CANCELED",
        unpaid: "PAST_DUE",
    };

    return statusMap[stripeStatus] || "PENDING";
}

/**
 * Handle subscription created/updated/deleted events
 */
export async function handleSubscriptionEvent(
    event: StripeEventOf<Stripe.Subscription>
): Promise<WebhookHandlerResult> {
    const subscription = event.data.object;
    const { userId, planId, organizationId: metaOrgId } = subscription.metadata || {};

    if (!userId || !planId) {

        return { success: false, reason: "missing_metadata" };
    }

    // Use organizationId from metadata if available (plan change flow),
    // otherwise look up by userId (onboarding flow)
    let organizationId = metaOrgId;
    if (!organizationId) {
        const organization = await webhookRepo.findOrganizationByUserId(userId);
        if (!organization) {

            return { success: false, reason: "organization_not_found" };
        }
        organizationId = organization.id;
    }

    // Prepare subscription data
    const subscriptionData = {
        status: mapStripeStatusToSubscriptionStatus(subscription.status),
        // Unexpanded, so customer arrives as an ID string; the object branch
        // exists only to narrow the union.
        stripeCustomerId:
            typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: billingPeriodOf(subscription).start,
        currentPeriodEnd: billingPeriodOf(subscription).end,
        canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
    };

    // Check if subscription already exists
    const existingSubscription = await webhookRepo.findSubscriptionByOrgId(organizationId);

    if (existingSubscription) {
        await webhookRepo.updateSubscriptionByOrgId(organizationId, subscriptionData);
    } else {
        await webhookRepo.createSubscription({
            ...subscriptionData,
            organizationId,
            planId,
        });
    }


    return { success: true, organizationId };
}

/**
 * Handle invoice paid event
 */
