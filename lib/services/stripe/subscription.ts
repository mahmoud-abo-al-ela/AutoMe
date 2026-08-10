// Stripe subscription service - Business logic for Stripe subscription operations
import Stripe from "stripe";

/**
 * BUG (still open — NOT fixed here): `Invoice.payment_intent` was removed from
 * the Stripe API in the 2025 "Basil" release and stripe@20 no longer declares
 * it, so `extractClientSecret` below always resolves to null.
 *
 * Verified against the live test API: the `latest_invoice.payment_intent`
 * *expand* is still accepted without error — it is the field that is absent, so
 * this fails silently rather than throwing. The fix (read
 * `invoice.confirmation_secret`, or pin an older `apiVersion`) needs a decision
 * about which API version to target, so it is deliberately left for its own PR.
 * Only reachable via the currently-orphaned Stripe Elements path.
 */
export type InvoiceWithLegacyPaymentIntent = Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null;
};

// Initialize Stripe with validation
function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY || "dummy_key";
    if (!secretKey || secretKey === "dummy_key" && process.env.NODE_ENV === "production") {
        console.warn("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(secretKey);
}

/**
 * Find or create a Stripe customer
 */
export async function findOrCreateCustomer(
    email: string,
    name: string | null | undefined,
    userId: string
): Promise<Stripe.Customer> {
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
export async function cancelIncompleteSubscriptions(
    customerId: string,
    stripePriceId: string
): Promise<void> {
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
export async function createStripeSubscription(
    customerId: string,
    stripePriceId: string,
    metadata: Stripe.MetadataParam
): Promise<Stripe.Subscription> {
    const stripe = getStripeClient();

    return stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
            save_default_payment_method: "on_subscription",
            // "apple_pay" / "google_pay" were removed here: they are card
            // wallets delivered under "card", not payment_method_types, and
            // Stripe rejects the whole request with
            // `Invalid payment_settings[payment_method_types][3]`. Verified
            // against the live test API. "amazon_pay" and "paypal" are valid.
            payment_method_types:
                process.env.NODE_ENV === "production"
                    ? ["card", "link", "amazon_pay", "paypal"]
                    : ["card", "link"],
        },
        expand: ["latest_invoice.payment_intent"],
        metadata,
    });
}

/**
 * Retrieve invoice with payment intent
 */
export async function retrieveInvoiceWithPaymentIntent(
    invoiceId: string
): Promise<Stripe.Invoice> {
    const stripe = getStripeClient();

    return stripe.invoices.retrieve(invoiceId, {
        expand: ["payment_intent"],
    });
}

/**
 * Retrieve payment intent
 */
export async function retrievePaymentIntent(
    paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
    const stripe = getStripeClient();

    return stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Create a payment intent for an invoice
 */
export async function createPaymentIntentForInvoice(
    invoice: Stripe.Invoice,
    customerId: string,
    metadata: Stripe.MetadataParam
): Promise<Stripe.PaymentIntent> {
    const stripe = getStripeClient();

    return stripe.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency || "usd",
        customer: customerId,
        metadata: {
            ...metadata,
            invoiceId: invoice.id ?? null,
        },
        // Same wallet correction as createStripeSubscription above.
        payment_method_types:
            process.env.NODE_ENV === "production"
                ? ["card", "link", "amazon_pay", "paypal"]
                : ["card", "link"],
    });
}


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

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(
    subscriptionId: string
): Promise<Stripe.Subscription> {
    const stripe = getStripeClient();

    return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Extract client secret from subscription
 */
export async function extractClientSecret(
    subscription: Stripe.Subscription
): Promise<string | null> {
    let latestInvoice: string | Stripe.Invoice | null = subscription.latest_invoice;

    // Handle case where expansion might have failed or returned ID
    if (typeof latestInvoice === "string") {
        latestInvoice = await retrieveInvoiceWithPaymentIntent(latestInvoice);
    }

    if (!latestInvoice || typeof latestInvoice !== "object") {
        return null;
    }

    const invoice = latestInvoice as InvoiceWithLegacyPaymentIntent;

    // If no payment intent exists on the invoice
    if (!invoice.payment_intent && invoice.status === "open") {
        return null;
    }

    // Extract client secret from payment intent
    if (invoice.payment_intent) {
        if (typeof invoice.payment_intent === "string") {
            const paymentIntent = await retrievePaymentIntent(invoice.payment_intent);
            return paymentIntent.client_secret;
        }
        return invoice.payment_intent.client_secret;
    }

    return null;
}
