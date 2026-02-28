// Stripe plan change service - Handle plan upgrades/downgrades
import Stripe from "stripe";

/**
 * Initialize Stripe with validation
 */
function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(secretKey);
}


export async function createNewSubscriptionCheckout({
    customerEmail,
    stripePriceId,
    successUrl,
    cancelUrl,
    metadata,
}) {
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: customerEmail,
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        subscription_data: {
            metadata: {
                userId: metadata.userId,
                planId: metadata.planId,
                organizationId: metadata.organizationId,
            },
        },
    });

    return { url: session.url, sessionId: session.id };
}

export async function updateSubscriptionPlan({
    stripeSubscriptionId,
    newStripePriceId,
    newPlanId,
}) {
    const stripe = getStripeClient();

    // Retrieve the current subscription to get the item ID
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    if (!subscription || subscription.items.data.length === 0) {
        throw new Error("Could not retrieve subscription details from Stripe");
    }

    const subscriptionItemId = subscription.items.data[0].id;

    // Update the subscription with the new price
    // Stripe automatically handles proration
    const updatedSubscription = await stripe.subscriptions.update(
        stripeSubscriptionId,
        {
            items: [
                {
                    id: subscriptionItemId,
                    price: newStripePriceId,
                },
            ],
            metadata: {
                ...subscription.metadata,
                planId: newPlanId,
            },
            proration_behavior: "create_prorations",
        }
    );

    return updatedSubscription;
}
