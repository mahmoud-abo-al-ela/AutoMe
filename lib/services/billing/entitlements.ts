import type { Plan, Subscription } from "@/lib/generated/prisma";
import * as billingRepo from "@/lib/repositories/billing";
import { isFreePlan } from "@/lib/utils/plan-change";
import { renewalStage } from "./periods";

/**
 * A plan feature as the gates read it. `limit` is a monthly or total count,
 * -1 for no limit, or null when the feature has none.
 */
export interface PlanFeature {
  enabled: boolean;
  limit: number | null;
}

const OFF: PlanFeature = { enabled: false, limit: null };

export function planFeature(plan: Pick<Plan, "features"> | null | undefined, key: string): PlanFeature {
  const features = plan?.features;
  if (!features || typeof features !== "object" || Array.isArray(features)) return OFF;
  const value = (features as Record<string, unknown>)[key];

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const config = value as { enabled?: unknown; limit?: unknown };
    return {
      enabled: config.enabled === true,
      limit: typeof config.limit === "number" ? config.limit : null,
    };
  }
  if (typeof value === "boolean") return { enabled: value, limit: null };
  if (typeof value === "number") return { enabled: value !== 0, limit: value };
  if (typeof value === "string") return { enabled: value.length > 0, limit: null };
  return OFF;
}

type SubscriptionWithPlan = Subscription & { plan: Plan };

export async function planInEffect(
  organization: { id: string; subscription?: SubscriptionWithPlan | null },
  now: Date = new Date()
): Promise<Plan | null> {
  const subscription = organization.subscription;
  if (!subscription?.plan) return null;

  const end = subscription.currentPeriodEnd;
  const lapsed = !isFreePlan(subscription.plan) && end !== null && renewalStage(end, now) === "expired";
  if (!lapsed) return subscription.plan;

  const ahead = await billingRepo.findPaidRenewalAhead(organization.id, end);
  if (ahead?.periodStart && ahead.periodEnd && ahead.periodStart <= now && now < ahead.periodEnd) {
    return (await billingRepo.findPlanByType(ahead.plan.type)) ?? subscription.plan;
  }
  return billingRepo.findPlanByType("STARTER");
}
