import type { PlanType, Prisma } from "@/lib/generated/prisma";
import * as planRepo from "@/lib/repositories/super-admin/plan";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";

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

/** Prices arrive in piasters: the form converts the EGP the admin types. */
export async function updatePlan(planId: string, data: PlanFormInput) {
  // Get the existing plan first
  const existingPlan = await planRepo.findPlanById(planId);

  if (!existingPlan) {
    throw new NotFoundError("Plan");
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

  return planRepo.updatePlan(planId, updateData);
}

export async function createPlan(data: PlanFormInput) {
  // Check if plan type already exists
  const existingPlan = await planRepo.findPlanByType(data.type);

  if (existingPlan) {
    throw new ConflictError(`A ${data.type} plan already exists`);
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

  return planRepo.createPlan(planData);
}

export async function deletePlan(planId: string) {
  // Check for active subscriptions
  const plan = await planRepo.findPlanWithSubscriptionCount(planId);

  if (!plan) {
    throw new NotFoundError("Plan");
  }

  if (plan._count.subscriptions > 0) {
    throw new ConflictError(
      `Cannot delete plan with ${plan._count.subscriptions} active subscription(s). Please migrate subscribers first.`
    );
  }

  // Payments keep their plan as a financial record (Payment.planId is RESTRICT).
  if (plan._count.payments > 0) {
    throw new ConflictError(
      `Cannot delete a plan that has been paid for (${plan._count.payments} payment(s)). Deactivate it instead.`
    );
  }

  await planRepo.deletePlan(planId);
  return plan;
}
