import type { BillingPeriod, Prisma } from "@/lib/generated/prisma";
import type { PeriodBounds } from "./periods";

/**
 * The two whole-subscription states billing moves a dealership into, written
 * one way by everything that moves it: settling a payment, the owner's own
 * changes, and the daily renewals job.
 */

type SubscriptionWrite = Prisma.SubscriptionUncheckedUpdateInput;

/** Nothing waiting, nothing owed: what any paid or free period starts from. */
const CLEAR = {
  status: "ACTIVE",
  pendingPlanId: null,
  pendingBillingPeriod: null,
  cancelAtPeriodEnd: false,
  canceledAt: null,
  pastDueSince: null,
  trialEndsAt: null,
} as const satisfies SubscriptionWrite;

/** A paid period in effect: a payment's plan, period and dates. */
export function paidPeriodState(
  planId: string,
  billingPeriod: BillingPeriod,
  period: PeriodBounds
): SubscriptionWrite {
  return {
    ...CLEAR,
    planId,
    billingPeriod,
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
  };
}

/** The free plan: no period to end, nothing to renew. */
export function freePlanState(freePlanId: string, now: Date): SubscriptionWrite {
  return {
    ...CLEAR,
    planId: freePlanId,
    billingPeriod: "MONTHLY",
    currentPeriodStart: now,
    currentPeriodEnd: null,
  };
}
