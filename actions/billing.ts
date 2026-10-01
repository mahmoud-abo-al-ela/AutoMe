"use server";

import { z } from "zod";
import { getLocale } from "next-intl/server";
import { getOrganizationById, requireOwner } from "@/lib/getOrganization";
import * as billingService from "@/lib/services/billing";
import {
  cancelPlan as cancelPlanService,
  changePlan as changePlanService,
  keepCurrentPlan as keepCurrentPlanService,
  payRenewal as payRenewalService,
  type BillingActor,
} from "@/lib/services/billing/manage";
import { confirmPayment } from "@/lib/services/billing/confirm";
import { findPaymentSummary } from "@/lib/repositories/payment";
import { withAuth, withErrorHandling } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { createSuccessResponse } from "@/lib/utils/response";
import { NotFoundError } from "@/lib/utils/errors";
import { isLocale, routing } from "@/i18n/routing";

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

// ---------------------------------------------------------------- managing the plan

/** The organization, if the caller owns it; the billing actions are owner-only. */
async function ownedOrganization(userId: string, organizationId: string) {
  const organization = await getOrganizationById(organizationId);
  if (!organization) throw new NotFoundError("Organization");
  await requireOwner(userId, organization.id);
  return organization;
}

async function currentLocale() {
  const locale = await getLocale();
  return isLocale(locale) ? locale : routing.defaultLocale;
}

const actorOf = (user: BillingActor): BillingActor => ({ id: user.id, name: user.name, email: user.email });

const planChangeSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().min(1),
  billingPeriod: z.enum(["monthly", "yearly"]),
});

/**
 * Switch plan or billing period. An upgrade returns a Paymob checkout; a
 * downgrade is scheduled for the end of the paid period; changes that cost
 * nothing (during a trial, after a lapse) apply now. See lib/utils/plan-change.
 */
export const changePlan = withAuth(
  async (ctx, organizationId: string, planId: string, billingPeriod: string) => {
    await enforceRateLimit();
    const input = validateAction(planChangeSchema, { organizationId, planId, billingPeriod });
    const organization = await ownedOrganization(ctx.user.id, input.organizationId);

    const result = await changePlanService({
      organization,
      actor: actorOf(ctx.user),
      planId: input.planId,
      billingPeriod: input.billingPeriod === "yearly" ? "YEARLY" : "MONTHLY",
      locale: await currentLocale(),
    });
    return createSuccessResponse(result);
  }
);

const uuidSchema = z.string().uuid();

/** Pay for the next period now (a trial's first payment, or a renewal that is due). */
export const payRenewal = withAuth(async (ctx, organizationId: string) => {
  await enforceRateLimit();
  const organization = await ownedOrganization(ctx.user.id, validateAction(uuidSchema, organizationId));
  const { url } = await payRenewalService({
    organization,
    actor: actorOf(ctx.user),
    locale: await currentLocale(),
  });
  return createSuccessResponse({ url });
});

/** Stop renewing: the plan runs to the end of what is paid, then the free plan. */
export const cancelPlan = withAuth(async (ctx, organizationId: string) => {
  await enforceRateLimit();
  const organization = await ownedOrganization(ctx.user.id, validateAction(uuidSchema, organizationId));
  const result = await cancelPlanService({ organization, actor: actorOf(ctx.user) });
  return createSuccessResponse(result);
});

/** Undo a scheduled cancellation or plan change. */
export const keepCurrentPlan = withAuth(async (ctx, organizationId: string) => {
  await enforceRateLimit();
  const organization = await ownedOrganization(ctx.user.id, validateAction(uuidSchema, organizationId));
  await keepCurrentPlanService({ organization });
  return createSuccessResponse({ kept: true });
});

/**
 * Where an upgrade or renewal payment stands, for the page Paymob returns the
 * owner to; settles it from Paymob's own answer if the callback is late.
 * Not rate limited, like confirmSignupPayment: the page polls it.
 */
export const confirmBillingPayment = withAuth(async (ctx, organizationId: string, ref: string) => {
  const organization = await ownedOrganization(ctx.user.id, validateAction(uuidSchema, organizationId));
  const payment = await findPaymentSummary(validateAction(uuidSchema, ref));

  // Another dealership's payment reads as no payment at all.
  if (!payment || payment.organizationId !== organization.id || payment.purpose === "SIGNUP") {
    throw new NotFoundError("Payment");
  }

  const { state, payment: current } = await confirmPayment(payment);
  return createSuccessResponse({
    state,
    purpose: current.purpose,
    plan: current.plan,
    periodStart: current.periodStart,
    periodEnd: current.periodEnd,
  });
});
