import { AI_FEATURE_POLICY, DEALER_BILLED_FEATURES, type AiFeature } from "@/lib/ai/features";
import type { AiCallerContext } from "@/lib/ai/client";
import type { TenantContext } from "@/lib/auth/context";
import type { Plan } from "@/lib/generated/prisma";
import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import { enforceDealerAiLimit } from "@/lib/middleware/with-rate-limit";
import { planFeature, planInEffect } from "@/lib/services/billing/entitlements";
import { isFreePlan } from "@/lib/utils/plan-change";
import { PlanLimitError } from "@/lib/utils/errors";

/**
 * The one authorization step before a dealer's AI call: what AI_FEATURE_POLICY
 * says the feature needs, checked against the plan in effect now. Replaces the
 * withPlanGate(withUsageLimit(enforceDealerAiLimit(aiCallerFor))) stacks each
 * entry point assembled for itself.
 *
 *   1. the plan in effect (a lapsed paid plan is the free one) has the
 *      feature's gate switched on;
 *   2. if the feature is billed to the dealer, this month's allowance has room
 *      (cars saved with AI help — see lib/services/car/ai-allowance.ts);
 *   3. the dealer-AI rate limit;
 *
 * and returns who the call is billed to, at the priority the policy and plan
 * give. Throws PlanLimitError or RateLimitError; the caller decides whether a
 * refusal is the answer (a photo read) or a degraded result (a save without
 * its translation).
 */
export async function authorizeDealerAiFeature(ctx: TenantContext, feature: AiFeature): Promise<AiCallerContext> {
  const policy = AI_FEATURE_POLICY[feature];
  if (policy.audience !== "dealer") {
    throw new Error(`${feature} is not a dealer feature; use publicAiCaller`);
  }
  const upgradeUrl = `/org/${ctx.organization.slug}/billing`;

  const plan = await planInEffect(ctx.organization);
  if (!plan) {
    throw new PlanLimitError({ resource: feature, message: "No subscription plan found" });
  }

  if (policy.planGate && !planFeature(plan, policy.planGate).enabled) {
    throw new PlanLimitError({
      resource: policy.planGate,
      planType: plan.name,
      limit: 0,
      currentUsage: 0,
      upgradeUrl,
      message: `${policy.planGate} is not available on your plan`,
    });
  }

  if (policy.billedToDealer) {
    const limit = planFeature(plan, "aiProcessing").limit ?? 0;
    if (limit !== -1) {
      const used = await aiUsageRepository.countOrgAiCarsThisMonth(ctx.organization.id, DEALER_BILLED_FEATURES);
      if (used >= limit) {
        throw new PlanLimitError({
          resource: "aiProcessing",
          planType: plan.name,
          limit,
          currentUsage: used,
          upgradeUrl,
          message: "Upgrade your plan for more AI-powered image processing.",
        });
      }
    }
  }

  await enforceDealerAiLimit();

  return { organizationId: ctx.organization.id, userId: ctx.user.id, priority: priorityFor(feature, plan) };
}

/**
 * Who a call nobody signed in for is billed to — nobody — and how urgently it
 * runs, from the policy. `organizationId` is the storefront it was made on,
 * for reporting; never a dealer's allowance.
 */
export function publicAiCaller(feature: AiFeature, organizationId: string | null = null): AiCallerContext {
  const policy = AI_FEATURE_POLICY[feature];
  if (policy.audience === "dealer") {
    throw new Error(`${feature} is a dealer feature; use authorizeDealerAiFeature`);
  }
  return { organizationId, userId: null, priority: policy.priority === "standard" ? "standard" : "low" };
}

/** The policy's priority, with "plan" resolved: standard on a paid plan in effect, low on the free one. */
export function priorityFor(feature: AiFeature, plan: Pick<Plan, "monthlyPrice" | "yearlyPrice"> | null): "standard" | "low" {
  const priority = AI_FEATURE_POLICY[feature].priority;
  if (priority !== "plan") return priority;
  return plan && !isFreePlan(plan) ? "standard" : "low";
}
