import { PlanLimitError } from "@/lib/utils/errors";
import { RESOURCE_CONFIG } from "./plan-limits";
import type { TenantContext } from "@/lib/auth/context";

// Shape of a RESOURCE_CONFIG entry (plan-limits.js is still JS). One of
// planField / featureKey is set per resource.
interface ResourceConfig {
  planField?: string | null;
  featureKey?: string;
  countQuery: (orgId: string) => Promise<number>;
  label: string;
  upgradeMessage: string;
}

export function withUsageLimit<TArgs extends unknown[], TResult>(
  resource: string,
  action: (ctx: TenantContext, ...args: TArgs) => Promise<TResult>,
): (ctx: TenantContext, ...args: TArgs) => Promise<TResult> {
  return async (ctx, ...args) => {
    const config = (RESOURCE_CONFIG as Record<string, ResourceConfig | undefined>)[resource];
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

    let limit: number | null | undefined;
    if (config.planField) {
      limit = (plan as Record<string, unknown>)[config.planField] as number | null | undefined;
    } else if (config.featureKey) {
      const features = (plan.features ?? {}) as Record<string, unknown>;
      const featureConfig = features[config.featureKey];
      limit =
        typeof featureConfig === "object" && featureConfig !== null
          ? (featureConfig as { limit?: number }).limit
          : 0;
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
