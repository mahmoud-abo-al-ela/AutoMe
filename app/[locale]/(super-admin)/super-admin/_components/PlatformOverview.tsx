"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { OrgPageHeader } from "@/components/dashboard/OrgPageHeader";
import { SectionPanel } from "@/components/dashboard/SectionPanel";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { PlatformOverview as Data } from "@/lib/services/super-admin/overview";
import { MetricExplorer } from "./MetricExplorer";
import { NeedsAttention } from "./NeedsAttention";
import { OverviewControls } from "./OverviewControls";

const PLAN_ORDER = ["STARTER", "PRO", "ENTERPRISE"] as const;

/** A labelled bar on a track: its share of `max`, the count at the end. */
function BarRow({ label, value, max, display, tone = "bg-chart-1" }: { label: string; value: number; max: number; display: string; tone?: string }) {
  return (
    <li className="grid grid-cols-[minmax(0,7rem)_1fr_2.5rem] items-center gap-3 text-caption">
      <span>{label}</span>
      <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </span>
      <span className="text-end font-semibold tabular-nums">{display}</span>
    </li>
  );
}

/**
 * The super-admin overview (canvas: Super admin overview round 2, "3 · Metric
 * explorer"; page pattern: analytical, the period first): the period and its
 * comparison, five numbers as tabs over one chart, then the plans, the
 * test-drive funnel and the cars as they stand, then what needs attention.
 */
export function PlatformOverview({ data, compare, currentAdminId }: { data: Data; compare: boolean; currentAdminId: string }) {
  const t = useTranslations("superAdmin.overview");
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const n = (value: number) => fmt.number(value);
  const [pending, startTransition] = useTransition();
  const { plans, testDrives: drives, cars } = data;
  const carsTotal = cars.available + cars.hidden + cars.sold;

  return (
    <div className="flex flex-col gap-6">
      <OrgPageHeader
        title={t("title")}
        actions={<OverviewControls days={data.days} compare={compare} startTransition={startTransition} />}
        className="mb-0 md:mb-0"
      />

      <div aria-busy={pending} className={cn("flex flex-col gap-6 transition-opacity", pending && "opacity-60")}>
        <MetricExplorer metrics={data.metrics} windows={data.windows} compare={compare} />

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <SectionPanel title={t("plans.title")} hint={t("plans.total", { value: n(plans.total) })}>
            <ul className="flex flex-col gap-3">
              {PLAN_ORDER.map((type) => (
                <BarRow
                  key={type}
                  label={tPlans(`plans.${planKeyFor(type)}.name`)}
                  value={plans.byType[type] ?? 0}
                  max={plans.total}
                  display={n(plans.byType[type] ?? 0)}
                />
              ))}
            </ul>
            <p className="mt-4 text-caption text-muted-foreground">
              {t("plans.status", { paying: n(plans.paying), trial: n(plans.trialing), overdue: n(plans.overdue) })}
              {plans.monthlyIncome > 0 && <> {t("plans.income", { amount: formatPlanAmount(plans.monthlyIncome, fmt.locale) })}</>}
            </p>
          </SectionPanel>

          <SectionPanel title={t("drives.title")} hint={t(`period.d${data.days}`)}>
            {drives.requested === 0 ? (
              <p className="text-caption text-muted-foreground">{t("drives.empty")}</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {(
                  [
                    ["requested", drives.requested],
                    ["confirmed", drives.confirmed],
                    ["completed", drives.completed],
                  ] as const
                ).map(([key, value]) => (
                  <li key={key} className="flex flex-col gap-1">
                    <span className="flex justify-between gap-3 text-caption">
                      <span className="text-muted-foreground">{t(`drives.${key}`)}</span>
                      {key !== "requested" && (
                        <span className="font-semibold tabular-nums">{fmt.number(value / drives.requested, { style: "percent" })}</span>
                      )}
                    </span>
                    <span
                      className="flex h-7 min-w-10 items-center rounded-[6px] bg-chart-1 px-2.5 text-caption font-semibold text-white tabular-nums"
                      style={{ width: `${(value / drives.requested) * 100}%` }}
                    >
                      {n(value)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </SectionPanel>

          <SectionPanel title={t("cars.title")} hint={t("cars.total", { value: n(carsTotal) })}>
            <ul className="flex flex-col gap-3">
              <BarRow label={t("cars.available")} value={cars.available} max={carsTotal} display={n(cars.available)} />
              <BarRow label={t("cars.hidden")} value={cars.hidden} max={carsTotal} display={n(cars.hidden)} tone="bg-chart-5" />
              <BarRow label={t("cars.sold")} value={cars.sold} max={carsTotal} display={n(cars.sold)} tone="bg-chart-3" />
            </ul>
            {cars.dealerships > 0 && (
              <p className="mt-4 text-caption text-muted-foreground">
                {t("cars.average", { value: fmt.number(carsTotal / cars.dealerships, { maximumFractionDigits: 1 }) })}
              </p>
            )}
          </SectionPanel>
        </div>

        <NeedsAttention needsYou={data.needsYou} currentAdminId={currentAdminId} />
      </div>
    </div>
  );
}
