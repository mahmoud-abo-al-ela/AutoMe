"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Clock, CreditCard, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { formatPlanAmount } from "@/lib/utils/currency";
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

  const tone = pastDue
    ? {
        box: "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800",
        title: "text-red-800 dark:text-red-400",
        body: "text-red-700 dark:text-red-300",
        Icon: AlertTriangle,
        icon: "text-red-600",
      }
    : {
        box: "border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700",
        title: "text-amber-800 dark:text-amber-400",
        body: "text-amber-700 dark:text-amber-300",
        Icon: Clock,
        icon: "text-amber-600",
      };

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
    <Alert className={tone.box}>
      <tone.Icon className={`h-4 w-4 ${tone.icon}`} />
      <AlertTitle className={`font-semibold ${tone.title}`}>{title}</AlertTitle>
      <AlertDescription className={tone.body}>
        <p>{body}</p>
        {isOwner && (
          <Button
            size="sm"
            variant={pastDue ? "destructive" : "default"}
            className="mt-2 cursor-pointer"
            onClick={payNow}
            disabled={busy !== null}
          >
            {busy === "pay" ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 me-2" />
            )}
            {trialing || pastDue ? t("payNow") : t("renewNow")}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
