"use server";

import { db } from "@/lib/prisma";
import { revalidateLocalized } from "@/lib/utils/revalidate";
import * as orgService from "@/lib/services/super-admin/organization";
import * as subscriptionService from "@/lib/services/super-admin/subscription";
import * as dealershipsService from "@/lib/services/super-admin/dealerships";
import { parseDealershipQuery } from "@/lib/services/super-admin/dealerships-options";
import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import type { CreateOrganizationInput } from "@/lib/services/super-admin/organization";
import { validateAction } from "@/lib/middleware/with-validation";
import { createDealershipSchema } from "@/lib/validations/schemas";
import { z } from "zod";

/**
 * Create a new organization
 */
export const createOrganization = withSuperAdmin(
  async (admin, input: CreateOrganizationInput) => {
  const data = validateAction(createDealershipSchema, input);
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

  revalidateLocalized("/super-admin/organizations");
  return createSuccessResponse({ organization });
});

/**
 * Update organization status
 */
export const updateOrganizationStatus = withSuperAdmin(
  async (admin, orgId: string, isActive: boolean) => {
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

    revalidateLocalized("/super-admin/organizations");
    return createSuccessResponse(null, `Organization ${isActive ? "activated" : "suspended"}`);
  }
);

/**
 * Delete an organization (hard delete with all related data)
 */
export const deleteOrganization = withSuperAdmin(async (admin, orgId: string) => {
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

  revalidateLocalized("/super-admin/organizations");
  return createSuccessResponse(null, "Organization deleted");
});

/**
 * Whether a web address is free for a new dealership, as the admin types it.
 */
export const checkDealershipSlug = withSuperAdmin(async (_admin, slug: string) => {
  const value = validateAction(z.string().trim().max(60), slug);
  return createSuccessResponse(await orgService.checkSlug(value));
});

/**
 * Whether the owner's email already has an AutoMe account — they become the
 * owner straight away — or will be invited to sign up.
 */
export const checkOwnerEmail = withSuperAdmin(async (_admin, email: string) => {
  const value = validateAction(z.string().trim().email().max(254), email);
  return createSuccessResponse(await orgService.findAccountByEmail(value));
});

/**
 * Every dealership the list's current view and filters match, for its CSV.
 * Takes the list's URL params and reads them through the same parser as the
 * page, so anything unknown falls back to its default.
 */
export const exportDealerships = withSuperAdmin(async (_admin, params: Record<string, string>) => {
  const rows = await dealershipsService.getDealershipsForExport(
    parseDealershipQuery(typeof params === "object" && params ? params : {}),
  );
  return createSuccessResponse(rows);
});

/**
 * Change organization's subscription plan
 */
export const changeOrganizationPlan = withSuperAdmin(
  async (admin, orgId: string, planId: string) => {
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

    revalidateLocalized("/super-admin/organizations");
    return createSuccessResponse(null, "Plan changed successfully");
  }
);
