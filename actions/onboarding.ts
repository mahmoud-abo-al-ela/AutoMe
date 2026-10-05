"use server";

import { z } from "zod";
import { db } from "@/lib/prisma";
import {
  saveOnboardingSession as saveSession,
  resumeOnboardingSession as resumeSession,
} from "@/lib/services/onboarding/session";
import { createUnpaidOrganization } from "@/lib/services/billing/signup";
import { confirmPayment } from "@/lib/services/billing/confirm";
import { findPaymentSummary } from "@/lib/repositories/payment";
import { withAuth, withErrorHandling } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { createSuccessResponse } from "@/lib/utils/response";
import { NotFoundError } from "@/lib/utils/errors";
import { isValidSlug } from "@/lib/utils/slug";
import { validateAction } from "@/lib/middleware/with-validation";
import { organizationSchema } from "@/lib/validations/schemas";
import type { OrganizationInput } from "@/lib/validations/schemas";
import type { OnboardingSessionData } from "@/lib/services/onboarding/session";

export const checkSlugAvailability = withErrorHandling(async (slug: string) => {
  // Not worth a query for something the create step would refuse anyway.
  if (!isValidSlug(slug)) {
    return createSuccessResponse({ available: false });
  }

  const existing = await db.organization.findUnique({
    where: { slug },
    select: { id: true },
  });

  return createSuccessResponse({ available: !existing });
});

/**
 * Create a dealership on the free plan, or on a paid plan's free trial. A paid
 * plan without a trial is refused: those are created only by a settled
 * Paymob payment (lib/services/billing/settle.ts), whatever the client sends.
 */
export const createOrganization = withAuth(async (ctx, input: OrganizationInput) => {
  await enforceRateLimit();
  const data = validateAction(organizationSchema, input);

  const organization = await createUnpaidOrganization({
    user: ctx.user,
    details: {
      name: data.name,
      slug: data.slug,
      email: data.email,
      phone: data.phone,
      address: data.address,
      country: data.country,
      region: data.region,
      city: data.city,
      workingHours: data.workingHours,
    },
    logo: data.logo,
    planId: data.planId,
    billingPeriod: data.billingPeriod === "yearly" ? "YEARLY" : "MONTHLY",
  });

  return createSuccessResponse({
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
  });
});

export const saveOnboardingFormData = withAuth(
  async (ctx, formData: OnboardingSessionData) => {
  const result = await saveSession(ctx.user.id, formData);
  return createSuccessResponse({ sessionId: result.sessionId });
});

export const resumeOnboardingFormData = withAuth(async (ctx) => {
  const result = await resumeSession(ctx.user.id);

  if (!result) {
    return createSuccessResponse({ sessionId: null, data: null });
  }

  return createSuccessResponse({
    sessionId: result.sessionId,
    data: result.data,
  });
});

const paymentRefSchema = z.string().uuid();

/**
 * Where a sign-up payment stands, for the page Paymob returns the buyer to.
 * Settles it from Paymob's own answer when the callback has not arrived yet.
 *
 * Not rate limited: the page polls this every few seconds while a payment is
 * confirming, which the shared bucket (10 an hour) would cut off. It only
 * answers for the caller's own payment, and asks Paymob only while unpaid.
 */
export const confirmSignupPayment = withAuth(async (ctx, ref: string) => {
  const paymentId = validateAction(paymentRefSchema, ref);
  const payment = await findPaymentSummary(paymentId);

  // Someone else's payment reads as no payment at all.
  if (!payment || payment.userId !== ctx.user.id || payment.purpose !== "SIGNUP") {
    throw new NotFoundError("Payment");
  }

  const { state, payment: current } = await confirmPayment(payment);
  return createSuccessResponse({
    state,
    organizationSlug: current.organization?.slug ?? null,
  });
});
