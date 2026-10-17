"use server";

import { z } from "zod";
import { getOrganizationById, requireOwner } from "@/lib/getOrganization";
import * as billingService from "@/lib/services/billing";
import {
  cancelPlan as cancelPlanService,
  changePlan as changePlanService,
  keepCurrentPlan as keepCurrentPlanService,
  payRenewal as payRenewalService,
  type BillingActor,
} from "@/lib/services/billing/manage";
import { confirmDealershipPayment } from "@/lib/services/billing/confirm";
import { withAuth, withErrorHandling } from "@/lib/middleware/with-auth";
import { refuseDuringSupportSession } from "@/lib/auth/support-session";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { createSuccessResponse } from "@/lib/utils/response";
import { NotFoundError } from "@/lib/utils/errors";
import { returnLocale } from "@/lib/utils/return-locale";

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

// ---------------------------------------------------------------- managing the plan

/** The organization, if the caller owns it; the billing actions are owner-only. */
async function ownedOrganization(userId: string, organizationId: string) {
  const organization = await getOrganizationById(organizationId);
  if (!organization) throw new NotFoundError("Organization");
  await requireOwner(userId, organization.id);
  return organization;
}

const actorOf = (user: BillingActor): BillingActor => ({ id: user.id, name: user.name, email: user.email });

const planChangeSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().min(1),
  billingPeriod: z.enum(["monthly", "yearly"]),
});

export const changePlan = withAuth(
  async (ctx, organizationId: string, planId: string, billingPeriod: string, locale: string) => {
    refuseDuringSupportSession(ctx);
    await enforceRateLimit();
    const input = validateAction(planChangeSchema, { organizationId, planId, billingPeriod });
    const organization = await ownedOrganization(ctx.user.id, input.organizationId);

    const result = await changePlanService({
      organization,
      actor: actorOf(ctx.user),
      planId: input.planId,
      billingPeriod: input.billingPeriod === "yearly" ? "YEARLY" : "MONTHLY",
      locale: returnLocale(locale),
    });
    return createSuccessResponse(result);
  }
);

const uuidSchema = z.string().uuid();

/** Pay for the next period now (a trial's first payment, or a renewal that is due). */
export const payRenewal = withAuth(async (ctx, organizationId: string, locale: string) => {
  refuseDuringSupportSession(ctx);
  await enforceRateLimit();
  const organization = await ownedOrganization(ctx.user.id, validateAction(uuidSchema, organizationId));
  const { url } = await payRenewalService({
    organization,
    actor: actorOf(ctx.user),
    locale: returnLocale(locale),
  });
  return createSuccessResponse({ url });
});

/** Stop renewing: the plan runs to the end of what is paid, then the free plan. */
export const cancelPlan = withAuth(async (ctx, organizationId: string) => {
  refuseDuringSupportSession(ctx);
  await enforceRateLimit();
  const organization = await ownedOrganization(ctx.user.id, validateAction(uuidSchema, organizationId));
  const result = await cancelPlanService({ organization, actor: actorOf(ctx.user) });
  return createSuccessResponse(result);
});

/** Undo a scheduled cancellation or plan change. */
export const keepCurrentPlan = withAuth(async (ctx, organizationId: string) => {
  refuseDuringSupportSession(ctx);
  await enforceRateLimit();
  const organization = await ownedOrganization(ctx.user.id, validateAction(uuidSchema, organizationId));
  await keepCurrentPlanService({ organization });
  return createSuccessResponse({ kept: true });
});

export const confirmBillingPayment = withAuth(async (ctx, organizationId: string, ref: string) => {
  const organization = await ownedOrganization(ctx.user.id, validateAction(uuidSchema, organizationId));
  const { state, payment: current } = await confirmDealershipPayment(
    organization.id,
    validateAction(uuidSchema, ref)
  );
  return createSuccessResponse({
    state,
    purpose: current.purpose,
    plan: current.plan,
    periodStart: current.periodStart,
    periodEnd: current.periodEnd,
  });
});
