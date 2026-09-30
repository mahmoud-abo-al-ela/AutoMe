import type { TenantContext } from "@/lib/auth/context";
import type { AiCallerContext } from "@/lib/ai/client";

/**
 * Who a dealer-side AI call is billed to, from the tenant context.
 *
 * `userId` is the database User.id. `ctx.userId` is the Clerk id, which the
 * AiUsage foreign key rejects — and a lost row is a call the quota never counts.
 *
 * Free-plan calls run at low priority, so they stop short of the shared
 * platform cap and cannot leave paying dealers facing "AI busy".
 */
export function aiCallerFor(ctx: TenantContext): AiCallerContext {
  const isFreePlan = !(ctx.organization.subscription?.plan?.monthlyPrice ?? 0);
  return {
    organizationId: ctx.organization.id,
    userId: ctx.user.id,
    priority: isFreePlan ? "low" : "standard",
  };
}
