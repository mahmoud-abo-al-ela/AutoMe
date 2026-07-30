"use server";

import * as paymentService from "@/lib/services/payment";
import { withAuth } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import {
  createSubscriptionSchema,
  createCheckoutSessionSchema,
} from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";
import { ValidationError } from "@/lib/utils/errors";

function handleStripeError(error) {
  if (error.message?.includes("STRIPE_SECRET_KEY is not configured")) {
    throw new ValidationError(
      "Payment system is not configured. Please contact support."
    );
  }

  if (error.type === "StripeInvalidRequestError") {
    if (error.message?.includes("No such price")) {
      throw new ValidationError(
        "The selected plan has an invalid Stripe configuration. Please contact support."
      );
    }
    if (error.message?.includes("No such customer")) {
      throw new ValidationError(
        "Customer account issue. Please try again."
      );
    }
  }

  if (error.type === "StripeAuthenticationError") {
    throw new ValidationError(
      "Payment system configuration error. Please contact support."
    );
  }

  throw error;
}

export const createSubscription = withAuth(
  async (ctx, planId, billingInterval = "month") => {
    await enforceRateLimit();
    const validated = validateAction(createSubscriptionSchema, {
      planId,
      billingInterval,
    });

    try {
      const result = await paymentService.createSubscription(
        ctx.user,
        validated.planId,
        validated.billingInterval
      );

      return createSuccessResponse(result);
    } catch (error) {
      handleStripeError(error);
    }
  }
);

export const createCheckoutSession = withAuth(
  async (ctx, planId, billingPeriod, onboardingSessionId) => {
    await enforceRateLimit();
    const validated = validateAction(createCheckoutSessionSchema, {
      planId,
      billingPeriod,
      onboardingSessionId,
    });

    try {
      const result = await paymentService.createCheckoutSession(
        ctx.user,
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
