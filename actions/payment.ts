"use server";

import { startSignupCheckout } from "@/lib/services/billing/signup";
import { withAuth } from "@/lib/middleware/with-auth";
import { refuseDuringSupportSession } from "@/lib/auth/support-session";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { signupCheckoutSchema } from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";
import { returnLocale } from "@/lib/utils/return-locale";

export const createSignupCheckout = withAuth(
  async (ctx, planId: string, billingPeriod: string, onboardingSessionId: string, locale: string) => {
    refuseDuringSupportSession(ctx);
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
