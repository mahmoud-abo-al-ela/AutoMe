import { PlanLimitError } from "@/lib/utils/errors";

export function withPlanGate(feature, action) {
  return async (ctx, ...args) => {
    const plan = ctx.organization?.subscription?.plan;
    
    if (!plan) {
      throw new PlanLimitError({
        resource: feature,
        message: "No subscription plan found",
      });
    }

    const featureConfig = plan.features?.[feature];
    const isEnabled = typeof featureConfig === "object" ? featureConfig?.enabled : featureConfig;

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
