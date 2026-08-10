"use server";

import { checkUser } from "@/lib/checkUser";
import { getOrganizationById, getUserMembership, requireOwner } from "@/lib/getOrganization";
import * as billingService from "@/lib/services/billing";
import { createBillingPortalSession as createPortalSession } from "@/lib/services/stripe/portal";
import {
  createNewSubscriptionCheckout,
  updateSubscriptionPlan,
} from "@/lib/services/stripe/plan-change";
import { getCustomerInvoices } from "@/lib/services/stripe/invoices";
import { getDefaultPaymentMethod } from "@/lib/services/stripe/payment-method";
import { withAuth, withErrorHandling } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/utils/errors";


/**
 * Get all active plans
 */
export const getActivePlans = withErrorHandling(async () => {
  const plans = await billingService.getActivePlans();
  return createSuccessResponse(plans);
});

/**
 * Get a plan by ID
 */
export const getPlanById = withErrorHandling(async (planId: string) => {
  const plan = await billingService.getPlanById(planId);
  if (!plan) {
    throw new NotFoundError("Plan");
  }
  return createSuccessResponse(plan);
});


/**
 * Get billing data for an organization
 */
export const getBillingData = withAuth(async (ctx, organizationId: string) => {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new NotFoundError("Organization");
  }

  const data = await billingService.getBillingData(organization.id);
  return createSuccessResponse(data);
});

/**
 * Get billing history for an organization
 */
export const getBillingHistory = withAuth(async (ctx, organizationId: string) => {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new NotFoundError("Organization");
  }

  await requireOwner(ctx.user.id, organization.id);

  const history = await billingService.getBillingHistory(organization.id);
  return createSuccessResponse({ history });
});

/**
 * Get current subscription for an organization
 */
export const getCurrentSubscription = withAuth(async (ctx, organizationId: string) => {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new NotFoundError("Organization");
  }

  const subscription = await billingService.getActiveSubscription(organization.id);
  return createSuccessResponse(subscription);
});

/**
 * Get usage stats for an organization
 */
export const getUsageStats = withAuth(async (ctx, organizationId: string) => {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new NotFoundError("Organization");
  }

  const stats = await billingService.getUsageStats(organization.id);
  return createSuccessResponse(stats);
});



export const createBillingPortalSession = withAuth(
  async (ctx, organizationId: string, returnPath: string) => {
    const organization = await getOrganizationById(organizationId);
    if (!organization) {
      throw new NotFoundError("Organization");
    }

    await requireOwner(ctx.user.id, organization.id);

    const subscription = organization.subscription;
    if (!subscription?.stripeCustomerId) {
      throw new ValidationError(
        "No active Stripe subscription found. Please subscribe to a plan first."
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production"
        ? undefined
        : "http://localhost:3000");

    if (!appUrl) {
      throw new ValidationError("NEXT_PUBLIC_APP_URL is not configured");
    }

    const returnUrl = `${appUrl}${returnPath}`;
    const session = await createPortalSession(
      subscription.stripeCustomerId,
      returnUrl
    );
    return createSuccessResponse(session);
  }
);



export const createPlanChangeSession = withAuth(
  async (
    ctx,
    organizationId: string,
    newPlanId: string,
    billingCycle: string,
    billingPagePath: string
  ) => {
    const organization = await getOrganizationById(organizationId);
    if (!organization) {
      throw new NotFoundError("Organization");
    }

    await requireOwner(ctx.user.id, organization.id);

    // Get the new plan details
    const newPlan = await billingService.getPlanById(newPlanId);
    if (!newPlan) {
      throw new NotFoundError("Plan");
    }

    // Determine the Stripe price ID based on billing cycle
    const stripePriceId =
      billingCycle === "yearly"
        ? newPlan.stripeYearlyPriceId
        : newPlan.stripeMonthlyPriceId;

    // Check if the new plan is free (downgrade to starter)
    const newPrice =
      billingCycle === "yearly" ? newPlan.yearlyPrice : newPlan.monthlyPrice;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production"
        ? undefined
        : "http://localhost:3000");

    if (!appUrl) {
      throw new ValidationError("NEXT_PUBLIC_APP_URL is not configured");
    }

    const subscription = organization.subscription;

    // Case 1: User has an existing Stripe subscription — update it
    if (subscription?.stripeSubscriptionId && stripePriceId) {
      const updatedSubscription = await updateSubscriptionPlan({
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        newStripePriceId: stripePriceId,
        newPlanId: newPlan.id,
      });

      // Update our local subscription record with the new plan
      const { db } = await import("@/lib/prisma");
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: newPlan.id,
          status:
            updatedSubscription.status === "active"
              ? "ACTIVE"
              : subscription.status,
        },
      });

      return createSuccessResponse({ type: "updated" });
    }

    // Case 2: No existing subscription and new plan is free — nothing to do
    if (newPrice === 0) {
      throw new ValidationError("You are already on the free plan");
    }

    // Case 3: No existing Stripe subscription — create a Checkout session
    if (!stripePriceId) {
      throw new ValidationError(
        `Plan "${newPlan.name}" is not configured for Stripe billing. Please contact support.`
      );
    }

    const successUrl = `${appUrl}${billingPagePath}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}${billingPagePath}`;

    const { url } = await createNewSubscriptionCheckout({
      customerEmail: ctx.user.email,
      stripePriceId,
      successUrl,
      cancelUrl,
      metadata: {
        userId: ctx.user.id,
        planId: newPlan.id,
        organizationId: organization.id,
        billingCycle,
        type: "plan_change",
      },
    });

    return createSuccessResponse({ type: "redirect", url });
  }
);



/**
 * Get the default payment method for an organization's Stripe customer
 */
export const getPaymentMethod = withAuth(async (ctx, organizationId: string) => {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new NotFoundError("Organization");
  }

  const membership = await getUserMembership(ctx.user.id, organization.id);
  if (!membership) {
    throw new AuthorizationError("You are not a member of this organization");
  }

  const subscription = organization.subscription;
  if (!subscription?.stripeCustomerId) {
    return createSuccessResponse(null);
  }

  const paymentMethod = await getDefaultPaymentMethod(
    subscription.stripeCustomerId
  );
  return createSuccessResponse(paymentMethod);
});



export const getInvoices = withAuth(
  async (
    ctx,
    organizationId: string,
    options: { limit?: number; startingAfter?: string } = {}
  ) => {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new NotFoundError("Organization");
  }

  await requireOwner(ctx.user.id, organization.id);

  const subscription = organization.subscription;
  if (!subscription?.stripeCustomerId) {
    return createSuccessResponse({
      invoices: [],
      hasMore: false,
      nextCursor: null,
    });
  }

  const invoices = await getCustomerInvoices(
    subscription.stripeCustomerId,
    options
  );
  return createSuccessResponse(invoices);
});
