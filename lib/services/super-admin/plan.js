import * as planRepo from "@/lib/repositories/super-admin/plan";
import * as stripePlanService from "@/lib/services/stripe/plan";

/**
 * Plan service for Super Admin operations
 */

export async function updatePlan(planId, data) {
  // Get the existing plan first
  const existingPlan = await planRepo.findPlanById(planId);

  if (!existingPlan) {
    throw new Error("Plan not found");
  }

  const updateData = {
    name: data.name,
    monthlyPrice: parseInt(data.monthlyPrice) || 0,
    yearlyPrice: parseInt(data.yearlyPrice) || 0,
    maxCars: parseInt(data.maxCars) || 0,
    maxMembers: parseInt(data.maxMembers) || 0,
    maxImagesPerCar: parseInt(data.maxImagesPerCar) || 0,
    auditLogRetentionDays: data.auditLogRetentionDays ? parseInt(data.auditLogRetentionDays) : null,
    features: data.features || {},
  };

  // Update Stripe resources if the plan has Stripe integration
  if (existingPlan.stripeProductId) {
    const stripeResources = await stripePlanService.updatePlanStripeResources(
      { ...updateData, id: planId, type: existingPlan.type },
      existingPlan
    );

    updateData.stripeProductId = stripeResources.stripeProductId;
    updateData.stripeMonthlyPriceId = stripeResources.stripeMonthlyPriceId;
    updateData.stripeYearlyPriceId = stripeResources.stripeYearlyPriceId;
  }

  return planRepo.updatePlan(planId, updateData);
}

export async function createPlan(data) {
  // Check if plan type already exists
  const existingPlan = await planRepo.findPlanByType(data.type);

  if (existingPlan) {
    throw new Error(`A ${data.type} plan already exists`);
  }

  const planData = {
    name: data.name,
    type: data.type,
    monthlyPrice: parseInt(data.monthlyPrice) || 0,
    yearlyPrice: parseInt(data.yearlyPrice) || 0,
    maxCars: parseInt(data.maxCars) || 0,
    maxMembers: parseInt(data.maxMembers) || 0,
    maxImagesPerCar: parseInt(data.maxImagesPerCar) || 0,
    auditLogRetentionDays: data.auditLogRetentionDays ? parseInt(data.auditLogRetentionDays) : null,
    features: data.features || {},
  };

  // Create Stripe resources for the plan
  const stripeResources = await stripePlanService.createPlanStripeResources(planData);

  planData.stripeProductId = stripeResources.stripeProductId;
  planData.stripeMonthlyPriceId = stripeResources.stripeMonthlyPriceId;
  planData.stripeYearlyPriceId = stripeResources.stripeYearlyPriceId;

  return planRepo.createPlan(planData);
}

export async function deletePlan(planId) {
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
  if (plan.stripeProductId) {
    await stripePlanService.archivePlanStripeResources(plan);
  }

  await planRepo.deletePlan(planId);
  return plan;
}
