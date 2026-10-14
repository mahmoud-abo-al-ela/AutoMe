import type { Plan, Subscription } from "@/lib/generated/prisma";
import * as billingRepo from "@/lib/repositories/billing";
import { isFreePlan } from "@/lib/utils/plan-change";
import { renewalStage } from "./periods";

/**
 * What a dealership's plan gives it — the one reader of plan features and
 * limits. Authentication says who is asking, membership whether they may act
 * for the dealership; this says only what the dealership is entitled to.
 */

/**
 * A plan feature as the gates read it. `limit` is a monthly or total count,
 * -1 for no limit, or null when the feature has none.
 */
export interface PlanFeature {
  enabled: boolean;
  limit: number | null;
}

const OFF: PlanFeature = { enabled: false, limit: null };

/**
 * Read one feature out of a plan's free-form `features` JSON, whatever shape
 * it was stored in: `{ enabled, limit }` (aiProcessing, aiAssistant), a
 * boolean (prioritySupport), a count, or a string tier ("basic" analytics).
 * Missing or unreadable is off — a gate never opens on a value it doesn't
 * understand. (The old checkPlanFeature read `{ enabled: false }` as on.)
 */
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

/**
 * The plan a dealership is entitled to right now.
 *
 * Usually its subscription's plan. But a paid plan whose period ended and
 * whose grace is over is the free plan, now — not when the daily renewal job
 * next runs and moves it there. Before this, a job that failed or stopped
 * early left the paid plan working indefinitely (fail-open). A renewal paid
 * for the period that has started counts, even before the job applies it.
 * Inside the grace the paid plan still works, as billing promises.
 *
 * Null when there is no subscription, or no free plan to fall back to: the
 * gates then refuse.
 */
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
