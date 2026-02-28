"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as planService from "@/lib/services/super-admin/plan";
import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";

/**
 * Update a plan's pricing and limits
 */
export const updatePlan = withSuperAdmin(async (admin, planId, data) => {
  const plan = await planService.updatePlan(planId, data);

  await db.auditLog.create({
    data: {
      action: "ORG_UPDATED",
      entityType: "SUBSCRIPTION",
      entityId: planId,
      userId: admin.id,
      userEmail: admin.email,
      metadata: data,
    },
  });

  revalidatePath("/super-admin/plans");
  return createSuccessResponse({ plan });
});

/**
 * Create a new plan
 */
export const createPlan = withSuperAdmin(async (admin, data) => {
  const plan = await planService.createPlan(data);

  await db.auditLog.create({
    data: {
      action: "ORG_CREATED",
      entityType: "SUBSCRIPTION",
      entityId: plan.id,
      userId: admin.id,
      userEmail: admin.email,
      metadata: { planName: data.name, planType: data.type },
    },
  });

  revalidatePath("/super-admin/plans");
  return createSuccessResponse({ plan });
});

/**
 * Delete a plan (only if no active subscriptions)
 */
export const deletePlan = withSuperAdmin(async (admin, planId) => {
  const plan = await planService.deletePlan(planId);

  await db.auditLog.create({
    data: {
      action: "ORG_DELETED",
      entityType: "SUBSCRIPTION",
      entityId: planId,
      userId: admin.id,
      userEmail: admin.email,
      metadata: { planName: plan.name, planType: plan.type },
    },
  });

  revalidatePath("/super-admin/plans");
  return createSuccessResponse(null, "Plan deleted");
});
