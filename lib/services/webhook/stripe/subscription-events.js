// Stripe subscription event handlers
import * as webhookRepo from "@/lib/repositories/webhook";

export function mapStripeStatusToSubscriptionStatus(stripeStatus) {
    const statusMap = {
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
export async function handleSubscriptionEvent(event) {
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
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
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
