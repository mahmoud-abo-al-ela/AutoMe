"use server";

import { withOrgAuth } from "@/lib/middleware/with-auth";
import { RESOURCE_CONFIG } from "@/lib/middleware/plan-limits";
import { createSuccessResponse } from "@/lib/utils/response";

export const getPlanGateStatus = withOrgAuth(async (ctx, resource) => {
  const config = RESOURCE_CONFIG[resource];
  if (!config) {
    throw new Error(`Unknown resource: ${resource}`);
  }

  const plan = ctx.organization?.subscription?.plan;
  if (!plan) {
    return createSuccessResponse({
      allowed: false,
      current: 0,
      limit: 0,
      planType: "NONE",
      upgradeUrl: `/org/${ctx.organization.slug}/billing`
    });
  }

  let limit;
  if (config.planField) {
    limit = plan[config.planField];
  } else if (config.featureKey) {
    const featureConfig = plan.features?.[config.featureKey];
    limit = typeof featureConfig === "object" ? featureConfig?.limit : 0;
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
