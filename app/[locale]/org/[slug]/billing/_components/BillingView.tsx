"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatPlanPrice, planKeyFor } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { isFreePlan, planChange } from "@/lib/utils/plan-change";
import { cn } from "@/lib/utils";
import { OrgPageHeader } from "../../_components/OrgPageHeader";
import BillingHistory from "./BillingHistory";
import LastPayment from "./LastPayment";
import NonOwnerBillingNotice from "./NonOwnerBillingNotice";
import PaymentHistory from "./PaymentHistory";
import { PlanChangeDialog } from "./PlanChangeDialog";
import { PlanColumn, type BillingCycle } from "./PlanColumn";
import RenewalBanner from "./RenewalBanner";
import { YourPlanDetails } from "./YourPlanDetails";
import { usePlanStatus } from "./use-plan-status";
import type {
  BillingPaidAhead,
  BillingPayment,
  BillingPlan,
  BillingRenewal,
  BillingSubscription,
  BillingUsage,
} from "./_lib/billing-types";

type Props = {
  plans: BillingPlan[];
  subscription: BillingSubscription;
  paidAhead: BillingPaidAhead;
  renewal: BillingRenewal;
  usage: BillingUsage;
  payments: BillingPayment[];
  lastPayment: BillingPayment | null;
  isOwner: boolean;
  owner: { name: string | null; email: string | null } | null;
  organizationId: string;
};

/**
 * Billing with the plans first (canvas: Billing round 1, "2 · Plans first").
 * The three plans side by side for the chosen period; the dealer's own is
 * outlined and carries their usage. Every other plan's button says what
 * choosing it does — pay now, or switch when the paid period ends — by the
 * same rule the server applies. Payments sit below.
 */
export function BillingView({ plans, subscription, paidAhead, renewal, usage, payments, lastPayment, isOwner, owner, organizationId }: Props) {
  const t = useTranslations("org.billing");
  const tPlans = useTranslations("plans");
  const { locale, date, number } = useFormatters();
  const status = usePlanStatus(subscription, paidAhead);
  const [cycle, setCycle] = useState<BillingCycle>(subscription?.billingPeriod === "YEARLY" ? "yearly" : "monthly");
  const [choosing, setChoosing] = useState<BillingPlan | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const period = cycle === "yearly" ? "YEARLY" : "MONTHLY";
  const yours = plans.find((plan) => plan.id === subscription?.planId) ?? plans.find((plan) => plan.type === "STARTER");
  const periodEnd = subscription?.currentPeriodEnd ? date(subscription.currentPeriodEnd, { month: "long" }) : "";
  const yearlySaving = (() => {
    const paid = plans.filter((plan) => plan.monthlyPrice > 0 && plan.yearlyPrice > 0);
    if (paid.length === 0) return 0;
    return Math.round(paid.reduce((sum, plan) => sum + (1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100, 0) / paid.length);
  })();

  // On a phone the plans scroll sideways; start on the dealer's own.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || row.scrollWidth <= row.clientWidth) return;
    row.querySelector<HTMLElement>("[data-yours] > article")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []);

  const nameOf = (plan: BillingPlan) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };

  /** What choosing this plan does, as its button says it; null when there is nothing to choose. */
  const actionLabel = (plan: BillingPlan) => {
    const change = planChange(subscription, plan, period);
    const name = nameOf(plan);
    const price = formatPlanPrice(plan, cycle, locale) ?? "";
    const samePlan = plan.id === subscription?.planId;
    switch (change) {
      case "none":
        return null;
      case "pay": {
        const upgrade = !!subscription && plan.monthlyPrice > subscription.plan.monthlyPrice;
        return t(upgrade ? "plans.actions.upgradePay" : "plans.actions.choosePay", { plan: name, price });
      }
      case "schedule":
        if (samePlan) return t("plans.actions.periodOn", { period, date: periodEnd });
        return t(isFreePlan(plan) ? "plans.actions.moveFreeOn" : "plans.actions.switchOn", { plan: name, date: periodEnd });
      case "apply":
        return isFreePlan(plan) ? t("plans.actions.moveFreeNow", { plan: name }) : t("plans.actions.periodNow", { period });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <OrgPageHeader
        title={t("title")}
        description={status.line ? t("summary", { plan: status.currentName, status: status.line.text }) : undefined}
        actions={
          <div role="radiogroup" aria-label={t("periodLabel")} className="grid w-full grid-cols-2 overflow-hidden rounded-full border border-[#8c8170] bg-card sm:w-auto">
            {(["monthly", "yearly"] as const).map((value) => (
              <label
                key={value}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap px-4 text-caption font-semibold transition-colors",
                  "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                  cycle === value ? "bg-inverse text-inverse-foreground" : "hover:bg-muted",
                )}
              >
                <input type="radio" name="billing-cycle" value={value} checked={cycle === value} onChange={() => setCycle(value)} className="sr-only" />
                {tPlans(value)}
                {value === "yearly" && yearlySaving > 0 && (
                  <span className="rounded-full bg-marker px-2 py-px text-micro font-bold text-marker-foreground">
                    {tPlans("save", { percentage: number(yearlySaving) })}
                  </span>
                )}
              </label>
            ))}
          </div>
        }
        className="mb-0 md:mb-0"
      />

      {!isOwner && <NonOwnerBillingNotice ownerName={owner?.name} ownerEmail={owner?.email} />}

      <RenewalBanner subscription={subscription} renewal={renewal} paidAhead={paidAhead} isOwner={isOwner} organizationId={organizationId} />

      <div
        ref={rowRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
      >
        {plans.map((plan) => {
          const isYours = plan.id === yours?.id;
          const label = actionLabel(plan);
          return (
            <div key={plan.id} data-yours={isYours || undefined} className="contents">
              <PlanColumn
                plan={plan}
                cycle={cycle}
                isYours={isYours}
                action={
                  label &&
                  (isOwner ? (
                    <Button
                      variant={isYours ? "outline-strong" : "inverse"}
                      size="xl"
                      className={cn("h-12 w-full whitespace-normal text-center", isYours && "border bg-field")}
                      onClick={() => setChoosing(plan)}
                    >
                      {label}
                    </Button>
                  ) : (
                    !isYours && <p className="text-center text-caption text-muted-foreground">{t("plans.ownerOnlyLong")}</p>
                  ))
                }
              >
                {isYours && (
                  <YourPlanDetails status={status} plan={plan} usage={usage} isOwner={isOwner} organizationId={organizationId} />
                )}
              </PlanColumn>
            </div>
          );
        })}
      </div>

      {isOwner && (
        <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_360px]">
          <PaymentHistory payments={payments} />
          <div className="flex flex-col gap-5">
            <LastPayment payment={lastPayment} />
            <BillingHistory organizationId={organizationId} />
          </div>
        </div>
      )}

      <PlanChangeDialog
        plan={choosing}
        cycle={cycle}
        subscription={subscription}
        paidAhead={paidAhead}
        organizationId={organizationId}
        onClose={() => setChoosing(null)}
      />
    </div>
  );
}
