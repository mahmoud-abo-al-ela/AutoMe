"use server";

import * as paymentService from "@/lib/services/payment";
import { withAuth } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import {
  createCheckoutSessionSchema,
} from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";
import { ValidationError } from "@/lib/utils/errors";
import { requireBillingEmail } from "@/lib/utils/userHelpers";

function handleStripeError(error: unknown): never {
  const err = error as { message?: string; type?: string; code?: string };
  if (err.message?.includes("STRIPE_SECRET_KEY is not configured")) {
    throw new ValidationError(
      "Payment system is not configured. Please contact support."
    );
  }

  if (err.type === "StripeInvalidRequestError") {
    if (err.message?.includes("No such price")) {
      throw new ValidationError(
        "The selected plan has an invalid Stripe configuration. Please contact support."
      );
    }
    if (err.message?.includes("No such customer")) {
      throw new ValidationError(
        "Customer account issue. Please try again."
      );
    }
  }

  if (err.type === "StripeAuthenticationError") {
    throw new ValidationError(
      "Payment system configuration error. Please contact support."
    );
  }

  throw error;
}

export const createCheckoutSession = withAuth(
  async (
    ctx,
    planId: string,
    billingPeriod: string,
    onboardingSessionId: string
  ) => {
    await enforceRateLimit();
    const validated = validateAction(createCheckoutSessionSchema, {
      planId,
      billingPeriod,
      onboardingSessionId,
    });

    try {
      const result = await paymentService.createCheckoutSession(
        // Narrows ctx.user.email from string | null; a phone-only account
        // cannot subscribe until it has an address to receive receipts at.
        { ...ctx.user, email: requireBillingEmail(ctx.user) },
        validated.planId,
        validated.billingPeriod,
        validated.onboardingSessionId
      );

      return createSuccessResponse({ url: result.url });
    } catch (error) {
      handleStripeError(error);
    }
  }
);
