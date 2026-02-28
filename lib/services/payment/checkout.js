// Payment service - Business logic for Stripe Checkout session creation
import * as billingRepo from "@/lib/repositories/billing";
import * as stripeService from "@/lib/services/stripe/subscription";

/**
 * Create a Stripe Checkout Session for onboarding subscription.
 *
 * @param {Object} user - The authenticated user
 * @param {string} planId - The plan ID
 * @param {string} billingPeriod - "monthly" or "yearly"
 * @param {string} onboardingSessionId - The saved onboarding session ID
 * @returns {Promise<{ url: string }>} The Checkout Session URL
 */
export async function createCheckoutSession(
    user,
    planId,
    billingPeriod,
    onboardingSessionId,
) {
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
            onboardingSessionId,
        },
    });

    return { url: session.url };
}
