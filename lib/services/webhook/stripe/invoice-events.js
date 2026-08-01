// Stripe invoice event handlers
import * as webhookRepo from "@/lib/repositories/webhook";

export async function handleInvoicePaid(event) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
        return { success: false, reason: "no_subscription_id" };
    }

    // Find the subscription by Stripe subscription ID
    const subscription = await webhookRepo.findSubscriptionByStripeId(subscriptionId);

    if (!subscription) {

        return { success: false, reason: "subscription_not_found" };
    }

    // Update subscription status to active
    await webhookRepo.updateSubscriptionById(subscription.id, {
        status: "ACTIVE",
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
    });


    return { success: true, subscriptionId: subscription.id };
}

/**
 * Handle invoice payment failed event
 */
export async function handleInvoicePaymentFailed(event) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
        return { success: false, reason: "no_subscription_id" };
    }

    // Find the subscription by Stripe subscription ID
    const subscription = await webhookRepo.findSubscriptionByStripeId(subscriptionId);

    if (!subscription) {

        return { success: false, reason: "subscription_not_found" };
    }

    // Update subscription status to past_due
    await webhookRepo.updateSubscriptionById(subscription.id, {
        status: "PAST_DUE",
    });


    return { success: true, subscriptionId: subscription.id };
}

/**
 * Handle payment intent succeeded event
 */
