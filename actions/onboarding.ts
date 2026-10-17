"use server";

import { z } from "zod";
import {
  saveOnboardingSession as saveSession,
  resumeOnboardingSession as resumeSession,
} from "@/lib/services/onboarding/session";
import { createUnpaidOrganization } from "@/lib/services/billing/signup";
import { confirmSignupPaymentFor } from "@/lib/services/billing/confirm";
import { isSlugAvailable } from "@/lib/services/onboarding";
import { withAuth, withErrorHandling } from "@/lib/middleware/with-auth";
import { refuseDuringSupportSession } from "@/lib/auth/support-session";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { createSuccessResponse } from "@/lib/utils/response";
import { validateAction } from "@/lib/middleware/with-validation";
import { organizationSchema } from "@/lib/validations/schemas";
import type { OrganizationInput } from "@/lib/validations/schemas";
import type { OnboardingSessionData } from "@/lib/services/onboarding/session";

export const checkSlugAvailability = withErrorHandling(async (slug: string) => {
  return createSuccessResponse({ available: await isSlugAvailable(slug) });
});

export const createOrganization = withAuth(async (ctx, input: OrganizationInput) => {
  refuseDuringSupportSession(ctx);
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

export const confirmSignupPayment = withAuth(async (ctx, ref: string) => {
  const paymentId = validateAction(paymentRefSchema, ref);
  const { state, payment: current } = await confirmSignupPaymentFor(ctx.user.id, paymentId);
  return createSuccessResponse({
    state,
    organizationSlug: current.organization?.slug ?? null,
  });
});
