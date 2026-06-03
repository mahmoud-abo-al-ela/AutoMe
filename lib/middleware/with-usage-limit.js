import { PlanLimitError } from "@/lib/utils/errors";
import { RESOURCE_CONFIG } from "./plan-limits";

export function withUsageLimit(resource, action) {
  return async (ctx, ...args) => {
    const config = RESOURCE_CONFIG[resource];
    if (!config) {
      throw new Error(`Unknown resource limit check: ${resource}`);
    }

    const plan = ctx.organization?.subscription?.plan;
    if (!plan) {
      throw new PlanLimitError({
        resource,
        message: "No subscription plan found",
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

    // -1 means unlimited
    if (limit !== -1) {
      const currentUsage = await config.countQuery(ctx.organization.id);
      
      if (currentUsage >= limit) {
        throw new PlanLimitError({
          resource,
          planType: plan.name,
          limit,
          currentUsage,
          upgradeUrl: `/org/${ctx.organization.slug}/billing`,
          message: config.upgradeMessage,
        });
      }
    }

    return action(ctx, ...args);
  };
}
