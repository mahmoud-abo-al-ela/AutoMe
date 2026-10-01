// Stripe Customer Portal service - Create billing portal sessions
import Stripe from "stripe";
import { AppError } from "@/lib/utils/errors";

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
    stripeCustomerId: string | null | undefined,
    returnUrl: string
): Promise<{ url: string }> {
    const stripe = getStripeClient();

    if (!stripeCustomerId) {
        // A dealership that never checked out has no Stripe customer, which the
        // owner should be told rather than shown a generic failure.
        throw new AppError("No Stripe customer ID found for this subscription", 409, "NO_BILLING_ACCOUNT", {
            key: "errors.noBillingAccount",
        });
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
    });

    return { url: session.url };
}
