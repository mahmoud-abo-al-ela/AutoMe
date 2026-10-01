"use server";

import { startSignupCheckout } from "@/lib/services/billing/signup";
import { withAuth } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { signupCheckoutSchema } from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";
import { returnLocale } from "@/lib/utils/return-locale";

/**
 * Open a Paymob checkout for a paid plan chosen in onboarding. The dealership
 * is created when the payment settles, not here. `locale` is the page's, for
 * the page Paymob returns the buyer to.
 */
export const createSignupCheckout = withAuth(
  async (ctx, planId: string, billingPeriod: string, onboardingSessionId: string, locale: string) => {
    await enforceRateLimit();
    const validated = validateAction(signupCheckoutSchema, {
      planId,
      billingPeriod,
      onboardingSessionId,
    });

    const checkout = await startSignupCheckout({
      user: ctx.user,
      onboardingSessionId: validated.onboardingSessionId,
      planId: validated.planId,
      billingPeriod: validated.billingPeriod === "yearly" ? "YEARLY" : "MONTHLY",
      locale: returnLocale(locale),
    });

    return createSuccessResponse({ url: checkout.url });
  }
);
