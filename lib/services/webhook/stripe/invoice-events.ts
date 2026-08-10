// Stripe invoice event handlers
import type Stripe from "stripe";
import * as webhookRepo from "@/lib/repositories/webhook";
import type { StripeEventOf, WebhookHandlerResult } from "./subscription-events";

/**
 * BUG (surfaced by this conversion, NOT fixed here): Invoice.subscription was
 * removed in the 2025 Basil API release — it now lives under
 * invoice.parent.subscription_details.subscription — so both handlers below
 * currently bail out with "no_subscription_id" on every invoice event.
 * Behaviour is preserved; the fix belongs in its own PR.
 */
type InvoiceWithLegacySubscription = Stripe.Invoice & {
    subscription?: string | null;
};

export async function handleInvoicePaid(
    event: StripeEventOf<Stripe.Invoice>
): Promise<WebhookHandlerResult> {
    const invoice = event.data.object as InvoiceWithLegacySubscription;
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
export async function handleInvoicePaymentFailed(
    event: StripeEventOf<Stripe.Invoice>
): Promise<WebhookHandlerResult> {
    const invoice = event.data.object as InvoiceWithLegacySubscription;
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
