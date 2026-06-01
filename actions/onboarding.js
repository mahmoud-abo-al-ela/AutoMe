"use server";

import { db } from "@/lib/prisma";
import { auditHelpers } from "@/lib/services/audit/audit";
import { createAdminClient } from "@/lib/supabase";
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
} from "@/lib/utils/errors";
import { validateAction } from "@/lib/middleware/with-validation";
import { organizationSchema } from "@/lib/validations/schemas";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { RateLimitError } from "@/lib/utils/errors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Upload base64 image to Supabase Storage
 */
async function uploadLogoToStorage(base64Data, organizationSlug) {
  if (!base64Data || !base64Data.startsWith("data:image")) {
    return null;
  }

  try {
    const supabase = createAdminClient();

    // Extract the base64 content and mime type
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return null;
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, "base64");

    // Determine file extension
    const extMap = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    };
    const ext = extMap[mimeType] || "png";
    const fileName = `${organizationSlug}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("organization-logos")
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("organization-logos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    return null;
  }
}

export const checkSlugAvailability = withErrorHandling(async (slug) => {
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
    }
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

    // Create organization with related data in a transaction
    const organization = await db.$transaction(async (tx) => {
      // Upload logo to storage if provided (base64)
      let logoUrl = null;
      if (logo && logo.startsWith("data:image")) {
        logoUrl = await uploadLogoToStorage(logo, slug);
      } else if (logo) {
        // Already a URL
        logoUrl = logo;
      }

      // Create the organization
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          email,
          phone: phone || null,
          address: address || null,
          logo: logoUrl,
        },
      });

      // Create working hours
      if (workingHours) {
        const workingHoursData = Object.entries(workingHours).map(
          ([day, hours]) => ({
            organizationId: org.id,
            dayOfWeek: [day.toUpperCase()],
            openTime: hours.open,
            closeTime: hours.close,
            isOpen: !hours.closed,
          })
        );

        await tx.workingHours.createMany({
          data: workingHoursData,
        });
      }

      // Create owner membership
      await tx.membership.create({
        data: {
          userId: ctx.user.id,
          organizationId: org.id,
          role: "OWNER",
        },
      });

      // Create subscription
      const now = new Date();

      let trialEndsAt;
      let status = "ACTIVE";
      let currentPeriodStart = now;
      let currentPeriodEnd = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      if (stripeSubscription) {
        // Map Stripe subscription status to our subscription status
        const statusMap = {
          active: "ACTIVE",
          trialing: "TRIALING",
          incomplete: "PENDING",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          unpaid: "PAST_DUE",
        };
        status = statusMap[stripeSubscription.status] || "PENDING";

        trialEndsAt = stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null;

        // Only set period dates if they exist and are valid
        if (stripeSubscription.current_period_start) {
          currentPeriodStart = new Date(
            stripeSubscription.current_period_start * 1000
          );
        }
        if (stripeSubscription.current_period_end) {
          currentPeriodEnd = new Date(
            stripeSubscription.current_period_end * 1000
          );
        }
      } else {
        trialEndsAt =
          plan.trialDays > 0
            ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
            : null;
        status = trialEndsAt ? "TRIALING" : "ACTIVE";
      }

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: plan.id,
          status,
          trialEndsAt,
          currentPeriodStart,
          currentPeriodEnd,
          stripeSubscriptionId: stripeSubscription?.id,
          stripeCustomerId: stripeSubscription?.customer,
          stripePaymentIntentId: paymentIntentId || null,
        },
      });

      return org;
    });

    // Log the organization creation
    await auditHelpers.logOrgCreated(
      organization,
      ctx.user.id,
      ctx.user.email
    );

    // Send welcome email
    sendWelcomeEmail({
      to: ctx.user.email,
      userName: ctx.user.name || "there",
      dealershipName: organization.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/org/${organization.slug}/dashboard`,
    }).catch(console.error);

    return createSuccessResponse({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });
  }
);

export const saveOnboardingFormData = withAuth(async (ctx, formData) => {
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
  async (ctx, stripeSessionId) => {
    // 1. Retrieve Stripe Checkout Session
    const session = await retrieveCheckoutSession(stripeSessionId);

    if (session.payment_status !== "paid") {
      throw new ValidationError("Payment not completed");
    }

    // 2. Idempotency check — has an org already been created for this checkout?
    const existingSub =
      await findSubscriptionByCheckoutSessionId(stripeSessionId);
    if (existingSub?.organization) {
      return createSuccessResponse({
        organization: existingSub.organization,
        redirect: `/org/${existingSub.organization.slug}/dashboard`,
      });
    }

    // 3. Load saved onboarding data
    const { onboardingSessionId } = session.metadata;
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

    // 4. Validate slug availability
    const existing = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError("This URL slug is already taken");
    }

    // 5. Get the plan
    const plan = await db.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError("Plan");
    }

    // 6. Retrieve Stripe subscription details
    let stripeSubscription = null;
    if (session.subscription) {
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
      stripeSubscription = await stripeClient.subscriptions.retrieve(
        session.subscription
      );
    }

    // 7. Create organization with related data in a transaction
    const organization = await db.$transaction(async (tx) => {
      // Upload logo to storage if provided (base64)
      let logoUrl = null;
      if (logo && logo.startsWith("data:image")) {
        logoUrl = await uploadLogoToStorage(logo, slug);
      } else if (logo) {
        logoUrl = logo;
      }

      // Create the organization
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          email,
          phone: phone || null,
          address: address || null,
          logo: logoUrl,
        },
      });

      // Create working hours
      if (workingHours) {
        const workingHoursData = Object.entries(workingHours).map(
          ([day, hours]) => ({
            organizationId: org.id,
            dayOfWeek: [day.toUpperCase()],
            openTime: hours.open,
            closeTime: hours.close,
            isOpen: !hours.closed,
          })
        );

        await tx.workingHours.createMany({
          data: workingHoursData,
        });
      }

      // Create owner membership
      await tx.membership.create({
        data: {
          userId: ctx.user.id,
          organizationId: org.id,
          role: "OWNER",
        },
      });

      // Create subscription
      const now = new Date();
      let status = "ACTIVE";
      let trialEndsAt = null;
      let currentPeriodStart = now;
      let currentPeriodEnd = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      if (stripeSubscription) {
        const statusMap = {
          active: "ACTIVE",
          trialing: "TRIALING",
          incomplete: "PENDING",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          unpaid: "PAST_DUE",
        };
        status = statusMap[stripeSubscription.status] || "PENDING";

        trialEndsAt = stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null;

        if (stripeSubscription.current_period_start) {
          currentPeriodStart = new Date(
            stripeSubscription.current_period_start * 1000
          );
        }
        if (stripeSubscription.current_period_end) {
          currentPeriodEnd = new Date(
            stripeSubscription.current_period_end * 1000
          );
        }
      }

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: plan.id,
          status,
          trialEndsAt,
          currentPeriodStart,
          currentPeriodEnd,
          stripeSubscriptionId: stripeSubscription?.id || null,
          stripeCustomerId: session.customer || null,
          stripeCheckoutSessionId: stripeSessionId,
        },
      });

      return org;
    });

    // 8. Log the organization creation
    await auditHelpers.logOrgCreated(
      organization,
      ctx.user.id,
      ctx.user.email
    );

    // Send welcome email
    sendWelcomeEmail({
      to: ctx.user.email,
      userName: ctx.user.name || "there",
      dealershipName: organization.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/org/${organization.slug}/dashboard`,
    }).catch(console.error);

    // 9. Mark onboarding session as completed
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
