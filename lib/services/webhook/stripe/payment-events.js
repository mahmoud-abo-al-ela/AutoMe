// Stripe payment-intent event handlers
import * as webhookRepo from "@/lib/repositories/webhook";

export async function handlePaymentIntentSucceeded(event) {
    const paymentIntent = event.data.object;
    const { userId, planId } = paymentIntent.metadata || {};

    if (!userId || !planId) {

        return { success: false, reason: "missing_metadata" };
    }

    // Find the organization for this user
    const organization = await webhookRepo.findOrganizationByUserId(userId);

    if (!organization) {

        return { success: false, reason: "organization_not_found" };
    }

    const organizationId = organization.id;

    // Find the subscription by organization ID
    const subscription = await webhookRepo.findSubscriptionByOrgId(organizationId);

    if (!subscription) {

        return { success: false, reason: "subscription_not_found" };
    }

    // Update subscription status to active if it was pending
    if (subscription.status === "PENDING") {
        await webhookRepo.updateSubscriptionById(subscription.id, {
            status: "ACTIVE",
        });

        return { success: true, organizationId, activated: true };
    }

    return { success: true, organizationId, activated: false };
}

/**
 * Handle checkout.session.completed event.
 * Routes to the appropriate handler based on the session metadata type.
 */
