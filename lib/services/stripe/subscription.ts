// Stripe Checkout Session service.
//
// The Stripe Elements path that used to live here (findOrCreateCustomer,
// createStripeSubscription, createPaymentIntentForInvoice, extractClientSecret
// and friends) was removed: nothing called it, and Checkout already handles
// customer creation and wallet payment methods natively. If a bespoke Elements
// flow is ever needed, rebuild it against the current API rather than reviving
// the old code, which still assumed pre-2025 Invoice/Subscription shapes.
import Stripe from "stripe";

// Initialize Stripe with validation
function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY || "dummy_key";
    if (!secretKey || secretKey === "dummy_key" && process.env.NODE_ENV === "production") {
        console.warn("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(secretKey);
}

/**
 * Create a Checkout Session for the onboarding subscription.
 *
 * Deliberately does not set `payment_method_types`: Checkout offers whatever is
 * enabled on the account (cards, wallets, PayPal, Amazon Pay…), which is both
 * broader and less brittle than naming them here.
 */
export async function createStripeCheckoutSession({
    customerEmail,
    stripePriceId,
    metadata,
}: {
    customerEmail: string;
    stripePriceId: string;
    metadata: { userId: string; planId: string } & Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
    const stripe = getStripeClient();
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.NODE_ENV === "production"
            ? undefined
            : "http://localhost:3000");

    if (!appUrl) {
        throw new Error(
            "NEXT_PUBLIC_APP_URL is not configured. Please set it in your environment variables."
        );
    }

    return stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: customerEmail,
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `${appUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/onboarding?step=3`,
        metadata,
        subscription_data: {
            metadata: {
                userId: metadata.userId,
                planId: metadata.planId,
            },
        },
    });
}

export async function retrieveCheckoutSession(
    sessionId: string
): Promise<Stripe.Checkout.Session> {
    const stripe = getStripeClient();

    return stripe.checkout.sessions.retrieve(sessionId);
}
