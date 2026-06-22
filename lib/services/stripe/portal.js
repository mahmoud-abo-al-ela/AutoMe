// Stripe Customer Portal service - Create billing portal sessions
import Stripe from "stripe";

/**
 * Initialize Stripe with validation
 */
function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY || "dummy_key";
    if (secretKey === "dummy_key" && process.env.NODE_ENV === "production") {
        console.warn("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(secretKey);
}

export async function createBillingPortalSession(
    stripeCustomerId,
    returnUrl
) {
    const stripe = getStripeClient();

    if (!stripeCustomerId) {
        throw new Error("No Stripe customer ID found for this subscription");
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
    });

    return { url: session.url };
}
