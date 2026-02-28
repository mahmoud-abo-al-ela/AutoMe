// Stripe subscription service - Business logic for Stripe subscription operations
import Stripe from "stripe";

// Initialize Stripe with validation
function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(secretKey);
}

/**
 * Find or create a Stripe customer
 */
export async function findOrCreateCustomer(email, name, userId) {
    const stripe = getStripeClient();

    const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
    });

    if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
    }

    return stripe.customers.create({
        email,
        name: name || undefined,
        metadata: { userId },
    });
}

/**
 * Cancel incomplete subscriptions for a customer and plan
 */
export async function cancelIncompleteSubscriptions(customerId, stripePriceId) {
    const stripe = getStripeClient();

    const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "incomplete",
        limit: 10,
    });

    const matchingSubscription = existingSubscriptions.data.find((sub) => {
        return sub.items.data.some((item) => item.price.id === stripePriceId);
    });

    if (matchingSubscription) {
        await stripe.subscriptions.cancel(matchingSubscription.id);
    }
}

/**
 * Create a Stripe subscription
 */
export async function createStripeSubscription(customerId, stripePriceId, metadata) {
    const stripe = getStripeClient();

    return stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
            save_default_payment_method: "on_subscription",
            payment_method_types:
                process.env.NODE_ENV === "production"
                    ? ["card", "link", "amazon_pay", "apple_pay", "google_pay", "paypal"]
                    : ["card", "link"],
        },
        expand: ["latest_invoice.payment_intent"],
        metadata,
    });
}

/**
 * Retrieve invoice with payment intent
 */
export async function retrieveInvoiceWithPaymentIntent(invoiceId) {
    const stripe = getStripeClient();

    return stripe.invoices.retrieve(invoiceId, {
        expand: ["payment_intent"],
    });
}

/**
 * Retrieve payment intent
 */
export async function retrievePaymentIntent(paymentIntentId) {
    const stripe = getStripeClient();

    return stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Create a payment intent for an invoice
 */
export async function createPaymentIntentForInvoice(invoice, customerId, metadata) {
    const stripe = getStripeClient();

    return stripe.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency || "usd",
        customer: customerId,
        metadata: {
            ...metadata,
            invoiceId: invoice.id,
        },
        payment_method_types:
            process.env.NODE_ENV === "production"
                ? ["card", "link", "amazon_pay", "apple_pay", "google_pay", "paypal"]
                : ["card", "link"],
    });
}


export async function createStripeCheckoutSession({
    customerEmail,
    stripePriceId,
    metadata,
}) {
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


export async function retrieveCheckoutSession(sessionId) {
    const stripe = getStripeClient();

    return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(subscriptionId) {
    const stripe = getStripeClient();

    return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Extract client secret from subscription
 */
export async function extractClientSecret(subscription) {
    let latestInvoice = subscription.latest_invoice;

    // Handle case where expansion might have failed or returned ID
    if (typeof latestInvoice === "string") {
        latestInvoice = await retrieveInvoiceWithPaymentIntent(latestInvoice);
    }

    if (!latestInvoice || typeof latestInvoice !== "object") {
        return null;
    }

    // If no payment intent exists on the invoice
    if (!latestInvoice.payment_intent && latestInvoice.status === "open") {
        return null;
    }

    // Extract client secret from payment intent
    if (latestInvoice.payment_intent) {
        if (typeof latestInvoice.payment_intent === "string") {
            const paymentIntent = await retrievePaymentIntent(latestInvoice.payment_intent);
            return paymentIntent.client_secret;
        }
        return latestInvoice.payment_intent.client_secret;
    }

    return null;
}
