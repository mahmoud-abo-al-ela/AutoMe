import { PlanLimitError } from "@/lib/utils/errors";
import type { TenantContext } from "@/lib/auth/context";

export function withPlanGate<TArgs extends unknown[], TResult>(
  feature: string,
  action: (ctx: TenantContext, ...args: TArgs) => Promise<TResult>,
): (ctx: TenantContext, ...args: TArgs) => Promise<TResult> {
  return async (ctx, ...args) => {
    const plan = ctx.organization?.subscription?.plan;

    if (!plan) {
      throw new PlanLimitError({
        resource: feature,
        message: "No subscription plan found",
      });
    }

    // plan.features is a Prisma Json column — narrow it to an object map.
    const features = (plan.features ?? {}) as Record<string, unknown>;
    const featureConfig = features[feature];
    const isEnabled =
      typeof featureConfig === "object" && featureConfig !== null
        ? (featureConfig as { enabled?: boolean }).enabled
        : featureConfig;

    if (!isEnabled) {
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
