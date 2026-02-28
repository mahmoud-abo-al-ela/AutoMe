// Payment service - Business logic for subscription creation
import * as billingRepo from "@/lib/repositories/billing";
import * as stripeService from "@/lib/services/stripe/subscription";

/**
 * Create a subscription for a user
 */
export async function createSubscription(user, planId, billingInterval = "month") {
    // Get plan details
    const plan = await billingRepo.findPlanById(planId);

    if (!plan) {
        throw new Error("Invalid plan");
    }

    // Determine the price based on billing interval
    const price = billingInterval === "year" ? plan.yearlyPrice : plan.monthlyPrice;
    const stripePriceId =
        billingInterval === "year" ? plan.stripeYearlyPriceId : plan.stripeMonthlyPriceId;

    // Check if plan is free
    if (price === 0) {
        return { isFree: true };
    }

    // Check if Stripe price ID exists
    if (!stripePriceId) {
        throw new Error(
            `Plan "${plan.name}" is not configured for Stripe billing. Please contact support.`
        );
    }

    // Find or create customer
    const customer = await stripeService.findOrCreateCustomer(
        user.email,
        user.name,
        user.id
    );

    // Cancel any existing incomplete subscriptions for this plan
    await stripeService.cancelIncompleteSubscriptions(customer.id, stripePriceId);

    // Create subscription
    const subscription = await stripeService.createStripeSubscription(
        customer.id,
        stripePriceId,
        {
            userId: user.id,
            planId: plan.id,
            billingInterval,
        }
    );

    // Try to extract client secret
    let clientSecret = await stripeService.extractClientSecret(subscription);

    // If no client secret and invoice is open, create payment intent manually
    if (!clientSecret) {
        const latestInvoice =
            typeof subscription.latest_invoice === "string"
                ? await stripeService.retrieveInvoiceWithPaymentIntent(subscription.latest_invoice)
                : subscription.latest_invoice;

        if (latestInvoice && latestInvoice.status === "open" && !latestInvoice.payment_intent) {
            const paymentIntent = await stripeService.createPaymentIntentForInvoice(
                latestInvoice,
                customer.id,
                {
                    subscriptionId: subscription.id,
                    userId: user.id,
                    planId: plan.id,
                }
            );

            clientSecret = paymentIntent.client_secret;

            return {
                subscriptionId: subscription.id,
                clientSecret,
                paymentIntentId: paymentIntent.id,
                invoiceId: latestInvoice.id,
                isFree: false,
            };
        }
    }

    // Validate we have a client secret for paid plans
    if (!clientSecret && price > 0) {
        console.error("Failed to get client secret from subscription:", {
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
        });

        // Cancel the incomplete subscription
        await stripeService.cancelStripeSubscription(subscription.id);

        throw new Error("Failed to initialize payment. Please try again or contact support.");
    }

    return {
        subscriptionId: subscription.id,
        clientSecret,
        isFree: false,
    };
}
