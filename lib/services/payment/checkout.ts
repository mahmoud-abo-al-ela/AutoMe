// Payment service - Business logic for Stripe Checkout session creation
import * as billingRepo from "@/lib/repositories/billing";
import * as stripeService from "@/lib/services/stripe/subscription";

/** The authenticated-user fields the payment services read. */
export interface PaymentUser {
    id: string;
    email: string;
    name?: string | null;
}

/**
 * BUG (surfaced by this conversion, NOT fixed here): the only caller validates
 * this through createCheckoutSessionSchema, whose enum is ["month", "year"] —
 * so "yearly" never arrives and the yearly branch below is unreachable. A
 * customer choosing the yearly plan is checked out at the MONTHLY price. Both
 * spellings are accepted here to preserve current behaviour exactly; picking
 * one vocabulary is its own PR.
 */
export type BillingPeriod = "monthly" | "yearly" | "month" | "year";

/**
 * Create a Stripe Checkout Session for onboarding subscription.
 */
export async function createCheckoutSession(
    user: PaymentUser,
    planId: string,
    billingPeriod: BillingPeriod,
    // Optional/nullable to match createCheckoutSessionSchema; it is only
    // forwarded into the session metadata.
    onboardingSessionId: string | null | undefined,
): Promise<{ url: string | null }> {
    // Get plan details
    const plan = await billingRepo.findPlanById(planId);

    if (!plan) {
        throw new Error("Invalid plan");
    }

    // Determine the Stripe price ID based on billing period
    const stripePriceId =
        billingPeriod === "yearly"
            ? plan.stripeYearlyPriceId
            : plan.stripeMonthlyPriceId;

    if (!stripePriceId) {
        throw new Error(
            `Plan "${plan.name}" is not configured for Stripe billing. Please contact support.`,
        );
    }

    // Create Stripe Checkout Session
    const session = await stripeService.createStripeCheckoutSession({
        customerEmail: user.email,
        stripePriceId,
        metadata: {
            userId: user.id,
            planId: plan.id,
            billingPeriod,
            // Omitted when absent, matching how Stripe already dropped an
            // undefined value from the form-encoded metadata.
            ...(onboardingSessionId ? { onboardingSessionId } : {}),
        },
    });

    return { url: session.url };
}
