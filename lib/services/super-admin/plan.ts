import type { PlanType, Prisma } from "@/lib/generated/prisma";
import * as planRepo from "@/lib/repositories/super-admin/plan";
import * as stripePlanService from "@/lib/services/stripe/plan";

/**
 * Plan service for Super Admin operations
 */

/**
 * The super-admin plan form payload. Numeric fields arrive as form strings and
 * are parsed below, so they are accepted as either.
 */
export interface PlanFormInput {
  name: string;
  type: PlanType;
  monthlyPrice?: string | number | null;
  yearlyPrice?: string | number | null;
  maxCars?: string | number | null;
  maxMembers?: string | number | null;
  maxImagesPerCar?: string | number | null;
  auditLogRetentionDays?: string | number | null;
  trialDays?: string | number | null;
  features?: Prisma.InputJsonValue;
}

/** parseInt over a form field that may already be a number. */
function toInt(value: string | number | null | undefined): number {
  return parseInt(String(value), 10) || 0;
}

export async function updatePlan(planId: string, data: PlanFormInput) {
  // Get the existing plan first
  const existingPlan = await planRepo.findPlanById(planId);

  if (!existingPlan) {
    throw new Error("Plan not found");
  }

  const updateData: Prisma.PlanUncheckedUpdateInput = {
    name: data.name,
    monthlyPrice: toInt(data.monthlyPrice),
    yearlyPrice: toInt(data.yearlyPrice),
    maxCars: toInt(data.maxCars),
    maxMembers: toInt(data.maxMembers),
    maxImagesPerCar: toInt(data.maxImagesPerCar),
    auditLogRetentionDays: data.auditLogRetentionDays ? toInt(data.auditLogRetentionDays) : null,
    trialDays: toInt(data.trialDays),
    features: data.features || {},
  };

  // Update Stripe resources if the plan has Stripe integration
  const { stripeProductId } = existingPlan;
  if (stripeProductId) {
    const stripeResources = await stripePlanService.updatePlanStripeResources(
      {
        id: planId,
        name: data.name,
        type: existingPlan.type,
        monthlyPrice: toInt(data.monthlyPrice),
        yearlyPrice: toInt(data.yearlyPrice),
      },
      {
        stripeProductId,
        stripeMonthlyPriceId: existingPlan.stripeMonthlyPriceId,
        stripeYearlyPriceId: existingPlan.stripeYearlyPriceId,
      }
    );

    updateData.stripeProductId = stripeResources.stripeProductId;
    updateData.stripeMonthlyPriceId = stripeResources.stripeMonthlyPriceId;
    updateData.stripeYearlyPriceId = stripeResources.stripeYearlyPriceId;
  }

  return planRepo.updatePlan(planId, updateData);
}

export async function createPlan(data: PlanFormInput) {
  // Check if plan type already exists
  const existingPlan = await planRepo.findPlanByType(data.type);

  if (existingPlan) {
    throw new Error(`A ${data.type} plan already exists`);
  }

  const planData: Prisma.PlanUncheckedCreateInput = {
    name: data.name,
    type: data.type,
    monthlyPrice: toInt(data.monthlyPrice),
    yearlyPrice: toInt(data.yearlyPrice),
    maxCars: toInt(data.maxCars),
    maxMembers: toInt(data.maxMembers),
    maxImagesPerCar: toInt(data.maxImagesPerCar),
    auditLogRetentionDays: data.auditLogRetentionDays ? toInt(data.auditLogRetentionDays) : null,
    trialDays: toInt(data.trialDays),
    features: data.features || {},
  };

  // Create Stripe resources for the plan. The row does not exist yet, so there
  // is no plan ID to stamp onto the Stripe product metadata — same as before.
  const stripeResources = await stripePlanService.createPlanStripeResources({
    name: planData.name,
    type: planData.type,
    monthlyPrice: toInt(data.monthlyPrice),
    yearlyPrice: toInt(data.yearlyPrice),
  });

  planData.stripeProductId = stripeResources.stripeProductId;
  planData.stripeMonthlyPriceId = stripeResources.stripeMonthlyPriceId;
  planData.stripeYearlyPriceId = stripeResources.stripeYearlyPriceId;

  return planRepo.createPlan(planData);
}

export async function deletePlan(planId: string) {
  // Check for active subscriptions
  const plan = await planRepo.findPlanWithSubscriptionCount(planId);

  if (!plan) {
    throw new Error("Plan not found");
  }

  if (plan._count.subscriptions > 0) {
    throw new Error(
      `Cannot delete plan with ${plan._count.subscriptions} active subscription(s). Please migrate subscribers first.`
    );
  }

  // Archive Stripe resources if the plan has Stripe integration
  const { stripeProductId } = plan;
  if (stripeProductId) {
    await stripePlanService.archivePlanStripeResources({ stripeProductId });
  }

  await planRepo.deletePlan(planId);
  return plan;
}
