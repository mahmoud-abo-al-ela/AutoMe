"use server";

import { recordAdminAuditEntry } from "@/lib/services/audit";
import { revalidateLocalized } from "@/lib/utils/revalidate";
import * as planService from "@/lib/services/super-admin/plan";
import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { validateAction } from "@/lib/middleware/with-validation";
import { planSettingsSchema } from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";
import { z } from "zod";

export const updatePlanSettings = withSuperAdmin(async (admin, planId: string, input: unknown) => {
  const id = validateAction(z.string().trim().min(1).max(64), planId);
  const settings = validateAction(planSettingsSchema, input);
  const { before, after } = await planService.updatePlanSettings(id, settings);

  await recordAdminAuditEntry({
    action: "ORG_UPDATED",
    entityType: "SUBSCRIPTION",
    entityId: id,
    userId: admin.id,
    userEmail: admin.email,
    oldValue: {
      monthlyPrice: before.monthlyPrice,
      yearlyPrice: before.yearlyPrice,
      trialDays: before.trialDays,
      maxCars: before.maxCars,
      maxMembers: before.maxMembers,
      maxImagesPerCar: before.maxImagesPerCar,
      auditLogRetentionDays: before.auditLogRetentionDays,
      features: before.features ?? {},
    },
    newValue: {
      monthlyPrice: after.monthlyPrice,
      yearlyPrice: after.yearlyPrice,
      trialDays: after.trialDays,
      maxCars: after.maxCars,
      maxMembers: after.maxMembers,
      maxImagesPerCar: after.maxImagesPerCar,
      auditLogRetentionDays: after.auditLogRetentionDays,
      features: after.features ?? {},
    },
    metadata: { planName: after.name, planType: after.type },
  });

  revalidateLocalized("/super-admin/plans");
  return createSuccessResponse({ planId: id });
});
