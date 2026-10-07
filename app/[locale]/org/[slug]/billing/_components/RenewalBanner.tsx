"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Clock, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { formatPlanAmount } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { useBillingActions } from "./use-billing-actions";
import type { BillingPaidAhead, BillingRenewal, BillingSubscription } from "./_lib/billing-types";

/**
 * The one banner that asks for money: a trial coming to an end, a renewal
 * that is due, or a payment that is overdue. Nothing shows once the next
 * period is paid, or when the plan is set to end.
 */
export default function RenewalBanner({
  subscription,
  renewal,
  paidAhead,
  isOwner,
  organizationId,
}: {
  subscription: BillingSubscription;
  renewal: BillingRenewal;
  paidAhead: BillingPaidAhead;
  isOwner: boolean;
  organizationId: string;
}) {
  const t = useTranslations("org.billing.banner");
  const tPlans = useTranslations("plans");
  const { date, number, locale } = useFormatters();
  const { busy, payNow } = useBillingActions(organizationId);

  if (!subscription || !renewal || paidAhead || subscription.cancelAtPeriodEnd) return null;

  const trialing = subscription.status === "TRIALING";
  const pastDue = subscription.status === "PAST_DUE" || renewal.stage === "grace";
  const due = renewal.stage === "due" || renewal.stage === "reminder";
  if (!trialing && !pastDue && !due) return null;

  const planKey = planKeyFor(renewal.plan.type);
  const plan = planKey ? tPlans(`plans.${planKey}.name`) : renewal.plan.name;
  const price = renewal.billingPeriod === "YEARLY" ? renewal.plan.yearlyPrice : renewal.plan.monthlyPrice;
  const amount = formatPlanAmount(price, locale);
  const end = subscription.currentPeriodEnd ? date(subscription.currentPeriodEnd, { month: "long" }) : "";
  const days = Math.max(renewal.daysLeft, 0);

  const Icon = pastDue ? AlertTriangle : Clock;

  const title = pastDue
    ? t("pastDueTitle")
    : trialing
      ? t("trialTitle", { count: days, value: number(days) })
      : t("dueTitle", { plan, date: end });
  const body = pastDue
    ? t("pastDueBody", { plan, date: date(renewal.graceEndsAt, { month: "long" }) })
    : trialing
      ? t("trialBody", { plan, amount, date: end })
      : t("dueBody", { amount, period: renewal.billingPeriod });

  return (
    <section
      aria-live="polite"
      className={cn(
        "flex flex-col gap-3 rounded-[20px] border-2 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5",
        pastDue ? "border-destructive bg-destructive-soft" : "border-border-strong bg-[#fff8dd]",
      )}
    >
      <Icon aria-hidden className={cn("size-6 shrink-0", pastDue ? "text-destructive" : "text-[#8a5e00]")} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className={cn("text-body font-extrabold", pastDue && "text-destructive")}>{title}</h2>
        <p className="text-caption">{body}</p>
      </div>
      {isOwner && (
        // The page's one marker-yellow action, when there is money to pay.
        <Button variant="marker" size="control" className="h-11 shrink-0" onClick={payNow} disabled={busy !== null}>
          {busy === "pay" ? <Loader2 aria-hidden className="animate-spin" /> : <CreditCard aria-hidden />}
          {trialing || pastDue ? t("payNow") : t("renewNow")}
        </Button>
      )}
    </section>
  );
}
