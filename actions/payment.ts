"use server";

import { getLocale } from "next-intl/server";
import { startSignupCheckout } from "@/lib/services/billing/signup";
import { withAuth } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { signupCheckoutSchema } from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";
import { isLocale, routing } from "@/i18n/routing";

/**
 * Open a Paymob checkout for a paid plan chosen in onboarding. The dealership
 * is created when the payment settles, not here.
 */
export const createSignupCheckout = withAuth(
  async (ctx, planId: string, billingPeriod: string, onboardingSessionId: string) => {
    await enforceRateLimit();
    const validated = validateAction(signupCheckoutSchema, {
      planId,
      billingPeriod,
      onboardingSessionId,
    });

    const locale = await getLocale();
    const checkout = await startSignupCheckout({
      user: ctx.user,
      onboardingSessionId: validated.onboardingSessionId,
      planId: validated.planId,
      billingPeriod: validated.billingPeriod === "yearly" ? "YEARLY" : "MONTHLY",
      locale: isLocale(locale) ? locale : routing.defaultLocale,
    });

    return createSuccessResponse({ url: checkout.url });
  }
);
