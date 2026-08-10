"use server";

import { db } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/services/onboarding/logo";
import {
  saveOnboardingSession as saveSession,
  getOnboardingSessionForUser,
  markOnboardingSessionCompleted,
  resumeOnboardingSession as resumeSession,
} from "@/lib/services/onboarding/session";
import { sendWelcomeEmail } from "@/lib/services/notification";
import { retrieveCheckoutSession } from "@/lib/services/stripe/subscription";
import { findSubscriptionByCheckoutSessionId } from "@/lib/repositories/webhook";
import Stripe from "stripe";
import { withAuth, withErrorHandling } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  logError,
} from "@/lib/utils/errors";
import { createOrganizationInTransaction } from "@/lib/services/onboarding/creation";
import { validateAction } from "@/lib/middleware/with-validation";
import { organizationSchema } from "@/lib/validations/schemas";
import type { OrganizationInput } from "@/lib/validations/schemas";
import type { OnboardingSessionData } from "@/lib/services/onboarding/session";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { RateLimitError } from "@/lib/utils/errors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key");

/**
 * Stripe returns customer/subscription unexpanded here, so these arrive as ID
 * strings; the object branch exists only to narrow the expandable union.
 */
function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export const checkSlugAvailability = withErrorHandling(async (slug: string) => {
  if (!slug || slug.length < 3) {
    return createSuccessResponse({ available: false });
  }

  const existing = await db.organization.findUnique({
    where: { slug },
    select: { id: true },
  });

  return createSuccessResponse({ available: !existing });
});

export const createOrganization = withAuth(
  async (
    ctx,
    {
      name,
      slug,
      email,
      phone,
      address,
      logo,
      planId,
      workingHours,
      userId,
      subscriptionId,
      paymentIntentId,
    }: OrganizationInput
  ) => {
    // Rate limit org creation
    const req = await request();
    const decision = await aj.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        throw new RateLimitError(
          `Rate limit exceeded. ${remaining} requests remaining until ${new Date(
            reset
          ).toLocaleString()}`
        );
      }
      throw new ValidationError("Request denied", "request");
    }

    // Validate payload
    const validatedData = validateAction(organizationSchema, {
      name,
      slug,
      email,
      phone,
      address,
      logo,
      planId,
      workingHours,
      userId,
      subscriptionId,
      paymentIntentId,
    });
    // Validate slug availability
    const existing = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError("This URL slug is already taken");
    }

    // Get the plan
    const plan = await db.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError("Plan");
    }

    // Retrieve Stripe subscription if provided
    let stripeSubscription = null;
    if (subscriptionId) {
      stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    }

    // Upload logo to storage if provided (base64)
    const logoUrl = await resolveLogoUrl(logo, slug);

    const stripeData = {
      subscriptionId: stripeSubscription?.id || subscriptionId,
      customerId: idOf(stripeSubscription?.customer),
      paymentIntentId,
      stripeSubscription,
      trialDays: plan.trialDays,
    };

    const organization = await createOrganizationInTransaction({
      name,
      slug,
      email,
      phone,
      address,
      logoUrl,
      workingHours,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      planId: plan.id,
      stripeData,
    });

    // Send welcome email
    sendWelcomeEmail({
      to: ctx.user.email,
      userName: ctx.user.name || "there",
      dealershipName: organization.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/org/${organization.slug}/dashboard`,
    }).catch((error) => {
      // Non-blocking: email failure should not fail the main operation
      logError(error);
    });

    return createSuccessResponse({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });
  }
);

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

export const createOrganizationAfterCheckout = withAuth(
  async (ctx, stripeSessionId: string) => {
    const session = await retrieveCheckoutSession(stripeSessionId);

    if (session.payment_status !== "paid") {
      throw new ValidationError("Payment not completed");
    }

    const existingSub =
      await findSubscriptionByCheckoutSessionId(stripeSessionId);
    if (existingSub?.organization) {
      return createSuccessResponse({
        organization: existingSub.organization,
        redirect: `/org/${existingSub.organization.slug}/dashboard`,
      });
    }

    const { onboardingSessionId } = session.metadata ?? {};
    const onboardingData = await getOnboardingSessionForUser(
      onboardingSessionId,
      ctx.user.id
    );

    if (!onboardingData) {
      throw new NotFoundError(
        "Onboarding session not found or expired. Please restart onboarding."
      );
    }

    const { name, slug, email, phone, address, logo, planId, workingHours } =
      onboardingData;

    const existing = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError("This URL slug is already taken");
    }

    const plan = await db.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError("Plan");
    }

    let stripeSubscription = null;
    const sessionSubscriptionId = idOf(session.subscription);
    if (sessionSubscriptionId) {
      stripeSubscription = await stripe.subscriptions.retrieve(
        sessionSubscriptionId
      );
    }

    const logoUrl = await resolveLogoUrl(logo, slug);

    const stripeData = {
      subscriptionId: stripeSubscription?.id ?? sessionSubscriptionId,
      customerId: idOf(session.customer),
      checkoutSessionId: stripeSessionId,
      stripeSubscription,
      trialDays: plan.trialDays,
    };

    const organization = await createOrganizationInTransaction({
      name,
      slug,
      email,
      phone,
      address,
      logoUrl,
      workingHours,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      planId: plan.id,
      stripeData,
    });

    // Send welcome email
    sendWelcomeEmail({
      to: ctx.user.email,
      userName: ctx.user.name || "there",
      dealershipName: organization.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/org/${organization.slug}/dashboard`,
    }).catch((error) => {
      // Non-blocking: email failure should not fail the main operation
      logError(error);
    });

    await markOnboardingSessionCompleted(onboardingSessionId);

    return createSuccessResponse({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });
  }
);
