import { PlanLimitError } from "@/lib/utils/errors";
import type { TenantContext } from "@/lib/auth/context";
import { planFeature, planInEffect } from "@/lib/services/billing/entitlements";

/**
 * Refuse an action the dealership's plan does not include. Reads the plan in
 * effect now (a lapsed paid plan is the free plan) and the feature through
 * the one reader, lib/services/billing/entitlements.ts.
 */
export function withPlanGate<TArgs extends unknown[], TResult>(
  feature: string,
  action: (ctx: TenantContext, ...args: TArgs) => Promise<TResult>,
): (ctx: TenantContext, ...args: TArgs) => Promise<TResult> {
  return async (ctx, ...args) => {
    const plan = await planInEffect(ctx.organization);

    if (!plan) {
      throw new PlanLimitError({
        resource: feature,
        message: "No subscription plan found",
      });
    }

    if (!planFeature(plan, feature).enabled) {
      throw new PlanLimitError({
        resource: feature,
        planType: plan.name,
        limit: 0,
        currentUsage: 0,
        upgradeUrl: `/org/${ctx.organization.slug}/billing`,
        message: `${feature} is not available on your plan`,
      });
    }

    return action(ctx, ...args);
  };
}
