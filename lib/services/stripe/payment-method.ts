// Stripe payment method service - Fetch default payment method for a customer
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

export interface PaymentMethodDto {
    id: string;
    type: "card";
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding: string | null;
}

/**
 * Get the default payment method for a Stripe customer.
 * Returns card brand, last 4 digits, expiry month/year, or null if none found.
 */
export async function getDefaultPaymentMethod(
    stripeCustomerId: string | null | undefined
): Promise<PaymentMethodDto | null> {
    const stripe = getStripeClient();

    if (!stripeCustomerId) {
        return null;
    }

    // Retrieve the customer to get their default payment method
    const customer = await stripe.customers.retrieve(stripeCustomerId, {
        expand: ["invoice_settings.default_payment_method"],
    });

    if (customer.deleted) {
        return null;
    }

    // Check invoice_settings default payment method first
    const defaultPm = customer.invoice_settings?.default_payment_method;

    if (defaultPm && typeof defaultPm === "object") {
        return formatPaymentMethod(defaultPm);
    }

    // Fallback: check the customer's default_source. It is unexpanded here, so
    // it arrives as an ID string; the object branch is only for type narrowing.
    const defaultSourceId =
        typeof customer.default_source === "string"
            ? customer.default_source
            : customer.default_source?.id;

    if (defaultSourceId) {
        try {
            const source = await stripe.customers.retrieveSource(
                stripeCustomerId,
                defaultSourceId
            );
            if (source.object === "card") {
                return {
                    id: source.id,
                    type: "card",
                    brand: normalizeBrand(source.brand),
                    last4: source.last4,
                    expMonth: source.exp_month,
                    expYear: source.exp_year,
                    funding: source.funding || null,
                };
            }
        } catch {
            // Source may not be accessible, continue to list fallback
        }
    }

    // Fallback: list payment methods and pick the first card
    const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card",
        limit: 1,
    });

    if (paymentMethods.data.length > 0) {
        return formatPaymentMethod(paymentMethods.data[0]);
    }

    return null;
}

/**
 * Format a Stripe PaymentMethod object into a simplified structure
 */
function formatPaymentMethod(pm: Stripe.PaymentMethod): PaymentMethodDto | null {
    if (!pm?.card) return null;

    return {
        id: pm.id,
        type: "card",
        brand: normalizeBrand(pm.card.brand),
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        funding: pm.card.funding || null,
    };
}

/**
 * Normalize card brand names for consistent display
 */
function normalizeBrand(brand: string | null | undefined): string {
    const brandMap: Record<string, string> = {
        visa: "Visa",
        mastercard: "Mastercard",
        amex: "American Express",
        discover: "Discover",
        diners: "Diners Club",
        jcb: "JCB",
        unionpay: "UnionPay",
    };

    return (brand && brandMap[brand.toLowerCase()]) || brand || "Card";
}
