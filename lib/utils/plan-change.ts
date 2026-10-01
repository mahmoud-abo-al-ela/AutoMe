/**
 * What switching plan (or billing period) does for a dealership. Shared by
 * the billing page (what the confirmation says) and the server (what it
 * does), so the two cannot disagree.
 *
 * Owner's rules (2026-10-01): an upgrade is paid in full now and starts a new
 * period today; a downgrade waits for the paid period to end. No proration.
 *
 *   none     — already on that plan and period;
 *   pay      — a checkout now, new period from today (an upgrade, or any paid
 *              plan when nothing is paid: free, a trial, past due);
 *   schedule — at the end of the paid period (a cheaper plan, the free plan,
 *              or a switch between monthly and yearly);
 *   apply    — now, with nothing to pay (to the free plan, or a trial's
 *              billing period, when no paid period would be cut short).
 */

export type PlanChange = "none" | "pay" | "schedule" | "apply";
export type Period = "MONTHLY" | "YEARLY";

interface PlanPrices {
  id: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

export interface CurrentSubscription {
  planId: string;
  plan: PlanPrices;
  status: string;
  billingPeriod: Period;
}

export const isFreePlan = (plan: Pick<PlanPrices, "monthlyPrice" | "yearlyPrice">) =>
  plan.monthlyPrice <= 0 && plan.yearlyPrice <= 0;

export function planChange(
  current: CurrentSubscription | null,
  target: PlanPrices,
  period: Period
): PlanChange {
  const targetFree = isFreePlan(target);

  // Nothing paid for: any paid plan is bought now.
  if (!current || isFreePlan(current.plan)) {
    return targetFree ? "none" : "pay";
  }

  const samePlan = target.id === current.planId;
  if (samePlan && (targetFree || period === current.billingPeriod)) return "none";

  // A trial or a lapsed period has nothing paid to protect.
  if (current.status === "TRIALING" || current.status === "PAST_DUE") {
    if (targetFree) return "apply";
    // A trial keeps its plan and only changes what it will be paid as.
    if (samePlan) return current.status === "TRIALING" ? "apply" : "none";
    return "pay";
  }

  if (targetFree || samePlan) return "schedule";
  return target.monthlyPrice > current.plan.monthlyPrice ? "pay" : "schedule";
}
