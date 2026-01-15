"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/services/super-admin/auth";
import * as orgService from "@/lib/services/super-admin/organization";
import * as subscriptionService from "@/lib/services/super-admin/subscription";

/**
 * Create a new organization
 */
export async function createOrganization(data) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

    const { organization, plan } = await orgService.createOrganization(data);

    await db.auditLog.create({
      data: {
        action: "ORG_CREATED",
        entityType: "ORGANIZATION",
        entityId: organization.id,
        userId: admin.id,
        userEmail: admin.email,
        organizationId: organization.id,
        metadata: {
          name: data.name,
          slug: organization.slug,
          planId: data.planId,
          planName: plan.name,
          ownerEmail: data.ownerEmail,
        },
      },
    });

    revalidatePath("/super-admin/organizations");
    return { success: true, organization };
  } catch (error) {
    console.error("Error creating organization:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update organization status
 */
export async function updateOrganizationStatus(orgId, isActive) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

    await orgService.updateOrganizationStatus(orgId, isActive);

    await db.auditLog.create({
      data: {
        action: isActive ? "ORG_ACTIVATED" : "ORG_SUSPENDED",
        entityType: "ORGANIZATION",
        entityId: orgId,
        userId: admin.id,
        userEmail: admin.email,
        organizationId: orgId,
        metadata: { isActive },
      },
    });

    revalidatePath("/super-admin/organizations");
    return { success: true };
  } catch (error) {
    console.error("Error updating organization:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an organization (hard delete with all related data)
 */
export async function deleteOrganization(orgId) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

    const org = await orgService.deleteOrganization(orgId);

    await db.auditLog.create({
      data: {
        action: "ORG_DELETED",
        entityType: "ORGANIZATION",
        entityId: orgId,
        userId: admin.id,
        userEmail: admin.email,
        metadata: {
          deletedOrg: org.name,
          deletedSlug: org.slug,
          hardDelete: true,
        },
      },
    });

    revalidatePath("/super-admin/organizations");
    return { success: true };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Change organization's subscription plan
 */
export async function changeOrganizationPlan(orgId, planId) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

    const { org, subscriptionId } = await orgService.changeOrganizationPlan(
      orgId,
      planId
    );
    await subscriptionService.changeOrganizationPlan(orgId, planId);

    await db.auditLog.create({
      data: {
        action: "SUBSCRIPTION_UPGRADED",
        entityType: "SUBSCRIPTION",
        entityId: subscriptionId || orgId,
        userId: admin.id,
        userEmail: admin.email,
        organizationId: orgId,
        metadata: { newPlanId: planId },
      },
    });

    revalidatePath("/super-admin/organizations");
    return { success: true };
  } catch (error) {
    console.error("Error changing plan:", error);
    return { success: false, error: error.message };
  }
}
