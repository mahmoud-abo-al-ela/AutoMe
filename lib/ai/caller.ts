import type { TenantContext } from "@/lib/auth/context";
import type { AiCallerContext } from "@/lib/ai/client";

export function aiCallerFor(ctx: TenantContext): AiCallerContext {
  const isFreePlan = !(ctx.organization.subscription?.plan?.monthlyPrice ?? 0);
  return {
    organizationId: ctx.organization.id,
    userId: ctx.user.id,
    priority: isFreePlan ? "low" : "standard",
  };
}
