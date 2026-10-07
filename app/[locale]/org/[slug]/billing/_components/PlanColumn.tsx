"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, Minus } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanPrice, planFeatureKeys, planKeyFor } from "@/components/Pricing/pricing-plans";
import { isFreePlan } from "@/lib/utils/plan-change";
import { cn } from "@/lib/utils";
import type { BillingPlan } from "./_lib/billing-types";

export type BillingCycle = "monthly" | "yearly";

/**
 * One plan, as a column (canvas: Billing round 1, "2 · Plans first"): its
 * name, price for the chosen period and what it includes. The dealer's own
 * plan is outlined and carries their usage and plan actions (`children`); the
 * others end in a button that says what choosing them does.
 */
export function PlanColumn({
  plan,
  cycle,
  isYours,
  action,
  children,
}: {
  plan: BillingPlan;
  cycle: BillingCycle;
  isYours: boolean;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const t = useTranslations("org.billing.plans");
  const tPlans = useTranslations("plans");
  const { number, locale } = useFormatters();
  const key = planKeyFor(plan.type);
  const name = key ? tPlans(`plans.${key}.name`) : plan.name;
  const free = isFreePlan(plan);
  const savings =
    cycle === "yearly" && plan.monthlyPrice > 0 && plan.yearlyPrice > 0
      ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)
      : 0;

  return (
    <article
      aria-label={name}
      className={cn(
        "flex w-[85%] max-w-[360px] shrink-0 snap-center flex-col gap-4 rounded-[20px] border p-5 sm:p-[22px] md:w-auto md:max-w-none",
        isYours ? "border-2 border-border-strong bg-field" : "border-border bg-card",
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[1.375rem] font-extrabold leading-tight">{name}</h2>
          {isYours ? (
            <span className="rounded-full bg-inverse px-2.5 py-0.5 text-micro font-bold text-inverse-foreground">{t("yourPlan")}</span>
          ) : (
            plan.type === "PRO" && (
              <span className="rounded-full bg-[#e7eef8] px-2.5 py-0.5 text-micro font-bold text-[#1d4e9e]">{tPlans("mostPopular")}</span>
            )
          )}
        </div>
        {key && <p className="text-caption text-muted-foreground">{tPlans(`plans.${key}.description`)}</p>}
      </div>

      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[2rem] font-extrabold leading-none tabular-nums">
          {free ? tPlans("free") : formatPlanPrice(plan, cycle, locale)}
        </span>
        {!free && <span className="text-caption font-semibold text-muted-foreground">{tPlans(cycle === "yearly" ? "perYear" : "perMonth")}</span>}
        {savings > 0 && (
          <span className="rounded-full bg-marker px-2 py-0.5 text-micro font-bold text-marker-foreground">
            {tPlans("save", { percentage: number(savings) })}
          </span>
        )}
      </p>

      {children}

      <ul className="flex flex-col gap-2 text-caption">
        {planFeatureKeys(plan).map((feature) => (
          <li key={feature.key} className={cn("flex items-start gap-2", !feature.included && "text-muted-foreground")}>
            {feature.included ? (
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-positive" />
            ) : (
              <Minus aria-hidden className="mt-0.5 size-4 shrink-0" />
            )}
            <span>
              {!feature.included && <span className="sr-only">{tPlans("notIncluded")}: </span>}
              {tPlans(
                `features.${feature.key}`,
                feature.params ? { count: feature.params.count, value: number(feature.params.count) } : undefined,
              )}
            </span>
          </li>
        ))}
      </ul>

      {action && <div className="mt-auto pt-1">{action}</div>}
    </article>
  );
}

/** How much of the plan the dealership uses: "34 of 100", with a bar; no bar when there is no limit. */
export function UsageMeter({ label, current, limit }: { label: string; current: number; limit: number }) {
  const t = useTranslations("org.billing.plans.usage");
  const { number } = useFormatters();
  const unlimited = limit === -1;
  const percent = unlimited || limit <= 0 ? 0 : Math.min((current / limit) * 100, 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-caption">
        <span>{label}</span>
        <b className="font-semibold tabular-nums">
          {unlimited ? t("unlimited", { current: number(current) }) : t("of", { current: number(current), limit: number(limit) })}
        </b>
      </div>
      {!unlimited && (
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={current}
          className="h-1.5 overflow-hidden rounded-full bg-border"
        >
          <span
            className={cn("block h-full rounded-full", percent >= 90 ? "bg-destructive" : "bg-inverse")}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
