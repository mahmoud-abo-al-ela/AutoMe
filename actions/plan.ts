"use server";

import { withOrgAuth } from "@/lib/middleware/with-auth";
import { RESOURCE_CONFIG } from "@/lib/middleware/plan-limits";
import { createSuccessResponse } from "@/lib/utils/response";
import { ValidationError } from "@/lib/utils/errors";
import { planFeature, planInEffect } from "@/lib/services/billing/entitlements";

export const getPlanGateStatus = withOrgAuth(async (ctx, resource: string) => {
  const config = RESOURCE_CONFIG[resource];
  if (!config) {
    throw new ValidationError(`Unknown resource: ${resource}`, "resource");
  }

  // The same reader and plan-in-effect the gates use, so the UI says what
  // the server will actually allow.
  const plan = await planInEffect(ctx.organization);
  if (!plan) {
    return createSuccessResponse({
      allowed: false,
      current: 0,
      limit: 0,
      planType: "NONE",
      upgradeUrl: `/org/${ctx.organization.slug}/billing`
    });
  }

  let limit: number | null | undefined;
  if (config.planField) {
    limit = plan[config.planField];
  } else if (config.featureKey) {
    // A disabled feature allows nothing, whatever limit it still stores.
    const feature = planFeature(plan, config.featureKey);
    limit = feature.enabled ? feature.limit : 0;
  }

  if (limit === undefined || limit === null) {
    limit = 0; // Deny by default if limit is not configured
  }

  let current = 0;
  if (limit !== -1) {
    current = await config.countQuery(ctx.organization.id);
  }

  const allowed = limit === -1 || current < limit;

  return createSuccessResponse({
    allowed,
    current,
    limit,
    planType: plan.name,
    upgradeUrl: `/org/${ctx.organization.slug}/billing`
  });
});
