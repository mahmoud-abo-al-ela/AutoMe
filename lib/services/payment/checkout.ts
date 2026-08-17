// Payment service - Business logic for Stripe Checkout session creation
import * as billingRepo from "@/lib/repositories/billing";
import * as stripeService from "@/lib/services/stripe/subscription";

/** The authenticated-user fields the payment services read. */
export interface PaymentUser {
    id: string;
    email: string;
    name?: string | null;
}

/** Matches createCheckoutSessionSchema and the onboarding plan toggle. */
export type BillingPeriod = "monthly" | "yearly";

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
        // The selected plan's own trial, not a platform-wide default. Without
        // this Stripe charges immediately, `trial_end` comes back null, and the
        // subscription is created ACTIVE — so a plan configured with a trial in
        // the super-admin UI silently did not have one.
        trialDays: plan.trialDays,
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
