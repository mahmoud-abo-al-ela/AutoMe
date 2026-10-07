"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { isFreePlan } from "@/lib/utils/plan-change";
import type { BillingPaidAhead, BillingSubscription } from "./_lib/billing-types";

export type PlanStatusTone = "neutral" | "good" | "warning" | "danger" | "info";

/**
 * Where the dealership's plan stands, in one line — the header's summary and
 * the line under the plan's name. Ordered by what an owner most needs to
 * know: an overdue payment first, then a plan that is ending or changing,
 * then whether the next period is already paid.
 */
export function usePlanStatus(subscription: BillingSubscription, paidAhead: BillingPaidAhead) {
  const t = useTranslations("org.billing.current");
  const tPlans = useTranslations("plans");
  const { date } = useFormatters();

  const planName = (plan: { type: string; name: string } | null | undefined) => {
    if (!plan) return tPlans("plans.starter.name");
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };
  const longDate = (value: Date | string) => date(value, { month: "long" });

  const plan = subscription?.plan;
  const status = subscription?.status;
  const paid = !!plan && !isFreePlan(plan);
  const end = subscription?.currentPeriodEnd ? longDate(subscription.currentPeriodEnd) : null;

  const line = ((): { tone: PlanStatusTone; text: string } | null => {
    if (!subscription || !paid) return { tone: "neutral", text: t("freePlan") };
    if (status === "PAST_DUE" && subscription.pastDueSince) {
      return { tone: "danger", text: t("pastDueSince", { date: longDate(subscription.pastDueSince) }) };
    }
    if (!end) return null;
    if (subscription.cancelAtPeriodEnd) return { tone: "neutral", text: t("endsOn", { date: end }) };
    if (subscription.pendingPlan) {
      return { tone: "info", text: t("changesOn", { plan: planName(subscription.pendingPlan), date: end }) };
    }
    if (subscription.pendingBillingPeriod) {
      return { tone: "info", text: t("switchesPeriodOn", { period: subscription.pendingBillingPeriod, date: end }) };
    }
    if (paidAhead?.periodEnd) return { tone: "good", text: t("paidThrough", { date: longDate(paidAhead.periodEnd) }) };
    if (status === "TRIALING") return { tone: "warning", text: t("trialEndsOn", { date: end }) };
    return { tone: "good", text: t("paidUntil", { date: end }) };
  })();

  return {
    planName,
    currentName: planName(plan),
    line,
    end,
    paid,
    // A scheduled change can be undone; a paid plan can be set to end, unless
    // the next period is already paid (the server refuses that too).
    canKeep: !!subscription && (subscription.cancelAtPeriodEnd || !!subscription.pendingPlan || !!subscription.pendingBillingPeriod),
    canCancel: !!subscription && paid && !subscription.cancelAtPeriodEnd && !paidAhead,
    cancelsNow: status === "PAST_DUE",
  };
}
