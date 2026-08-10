"use server";

import { withOrgAuth } from "@/lib/middleware/with-auth";
import { RESOURCE_CONFIG } from "@/lib/middleware/plan-limits";
import { createSuccessResponse } from "@/lib/utils/response";
import { ValidationError } from "@/lib/utils/errors";

export const getPlanGateStatus = withOrgAuth(async (ctx, resource: string) => {
  const config = RESOURCE_CONFIG[resource];
  if (!config) {
    throw new ValidationError(`Unknown resource: ${resource}`, "resource");
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

  let limit: number | null | undefined;
  if (config.planField) {
    limit = plan[config.planField];
  } else if (config.featureKey) {
    // Plan.features is free-form JSON; narrow before reading the nested limit.
    const features = (plan.features ?? {}) as Record<string, unknown>;
    const featureConfig = features[config.featureKey];
    limit =
      featureConfig && typeof featureConfig === "object"
        ? (featureConfig as { limit?: number }).limit
        : 0;
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
