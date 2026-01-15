"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/services/super-admin/auth";
import * as planService from "@/lib/services/super-admin/plan";

/**
 * Update a plan's pricing and limits
 */
export async function updatePlan(planId, data) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

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
    return { success: true, plan };
  } catch (error) {
    console.error("Error updating plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new plan
 */
export async function createPlan(data) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

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
    return { success: true, plan };
  } catch (error) {
    console.error("Error creating plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a plan (only if no active subscriptions)
 */
export async function deletePlan(planId) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

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
    return { success: true };
  } catch (error) {
    console.error("Error deleting plan:", error);
    return { success: false, error: error.message };
  }
}
