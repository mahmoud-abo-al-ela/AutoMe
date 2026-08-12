// Stripe invoice event handlers
import type Stripe from "stripe";
import * as webhookRepo from "@/lib/repositories/webhook";
import type { StripeEventOf, WebhookHandlerResult } from "./subscription-events";

/**
 * The subscription an invoice belongs to moved from Invoice.subscription to
 * Invoice.parent.subscription_details.subscription in the 2025 Basil API
 * release. Verified against a live paid invoice: the old field is undefined and
 * parent.type is "subscription_details".
 *
 * The subscription may itself be expanded, so narrow to an ID either way.
 */
function subscriptionIdOf(invoice: Stripe.Invoice): string | null {
    const subscription = invoice.parent?.subscription_details?.subscription;
    if (!subscription) return null;
    return typeof subscription === "string" ? subscription : subscription.id;
}

export async function handleInvoicePaid(
    event: StripeEventOf<Stripe.Invoice>
): Promise<WebhookHandlerResult> {
    const invoice = event.data.object;
    const subscriptionId = subscriptionIdOf(invoice);

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
export async function handleInvoicePaymentFailed(
    event: StripeEventOf<Stripe.Invoice>
): Promise<WebhookHandlerResult> {
    const invoice = event.data.object;
    const subscriptionId = subscriptionIdOf(invoice);

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
