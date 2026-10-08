"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Minus, Pencil } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { OrgPageHeader } from "@/components/dashboard/OrgPageHeader";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { PlanRow, PlansPage } from "@/lib/services/super-admin/plans";
import { PlanEditor } from "./PlanEditor";
import { PLAN_ROWS, usePlanValues, type PlanRowKey } from "./use-plan-values";

/**
 * The super-admin plans page (canvas: Super admin plans round 1, "1 ·
 * Comparison table"): four billing numbers, then every plan side by side —
 * who is on it and what it brings in at the top of its column, then a row
 * for each thing a plan sets. Edit opens the plan in a side panel. On a phone
 * each plan is its own card with the same rows.
 */
export function PlansView({ data }: { data: PlansPage }) {
  const t = useTranslations("superAdmin.plans");
  const fmt = useFormatters();
  const values = usePlanValues();
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const n = (value: number) => fmt.number(value);
  const { totals, plans } = data;

  const numbers = [
    { label: t("kpis.income"), value: values.amount(totals.income), note: null, tone: "" },
    { label: t("kpis.paying"), value: n(totals.paying), note: t("kpis.payingNote", { value: n(totals.dealerships) }), tone: "" },
    {
      label: t("kpis.trialing"),
      value: n(totals.trialing),
      note: totals.trialsEndingSoon ? t("kpis.trialsEnding", { value: n(totals.trialsEndingSoon) }) : t("kpis.noneEnding"),
      tone: "",
    },
    {
      label: t("kpis.overdue"),
      value: n(totals.overdue),
      note: totals.atRisk ? t("kpis.atRisk", { amount: values.amount(totals.atRisk) }) : t("kpis.nothingAtRisk"),
      tone: totals.overdue ? "text-destructive" : "",
    },
  ];

  const cell = (plan: PlanRow, row: PlanRowKey) => {
    const value = values.value(plan, row);
    if (typeof value === "boolean") {
      return value ? (
        <span className="inline-flex text-positive">
          <Check aria-hidden className="size-5" />
          <span className="sr-only">{t("values.included")}</span>
        </span>
      ) : (
        <span className="inline-flex text-muted-foreground">
          <Minus aria-hidden className="size-5" />
          <span className="sr-only">{t("values.notIncluded")}</span>
        </span>
      );
    }
    return value;
  };
  const who = (plan: PlanRow) => (
    <>
      <Link href={`/super-admin/organizations?plan=${plan.type}`} className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
        {t("table.dealerships", { count: plan.dealerships.total, value: n(plan.dealerships.total) })}
      </Link>
      <span className="block text-micro text-muted-foreground">
        {plan.dealerships.income > 0 ? t("table.income", { amount: values.amount(plan.dealerships.income) }) : plan.monthlyPrice > 0 ? t("table.nothingIn") : t("values.free")}
      </span>
    </>
  );
  const edit = (plan: PlanRow, full = false) => (
    <Button
      variant="outline-strong"
      size="sm"
      className={cn("h-9 bg-field", full && "h-10 w-full")}
      onClick={() => setEditing(plan)}
      aria-label={t("table.editPlan", { plan: values.name(plan) })}
    >
      <Pencil aria-hidden className="size-3.5" />
      {t("table.edit")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <OrgPageHeader title={t("title")} description={t("subtitle")} className="mb-0 md:mb-0" />

      <dl aria-label={t("kpis.label")} className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-border bg-card lg:grid-cols-4">
        {numbers.map((item, i) => (
          <div
            key={item.label}
            className={cn("flex flex-col gap-0.5 border-border p-4 sm:px-5", i % 2 === 1 && "border-s", i >= 2 && "border-t", "lg:border-t-0 lg:border-s lg:first:border-s-0")}
          >
            <dt className="text-caption text-muted-foreground">{item.label}</dt>
            <dd className={cn("text-[1.6rem] font-extrabold leading-tight tabular-nums", item.tone)}>{item.value}</dd>
            {item.note && <dd className="text-micro text-muted-foreground">{item.note}</dd>}
          </div>
        ))}
      </dl>

      {/* Laptops: the plans side by side. */}
      <section aria-label={t("table.label")} className="hidden overflow-hidden rounded-[20px] border border-border bg-card lg:block">
        <table className="w-full border-collapse text-caption">
          <thead>
            <tr className="border-b border-border">
              <td className="w-[26%] px-5 py-4" />
              {plans.map((plan) => (
                <th key={plan.id} scope="col" className="px-4 py-4 text-center align-top font-normal">
                  <span className="block text-[1.25rem] font-extrabold">{values.name(plan)}</span>
                  <span className="mt-1 block">{who(plan)}</span>
                  <span className="mt-3 inline-flex">{edit(plan)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_ROWS.map((row) => (
              <tr key={row} className="border-b border-border last:border-b-0">
                <th scope="row" className="bg-muted/40 px-5 py-3 text-start font-semibold text-muted-foreground">
                  {t(`rows.${row}`)}
                </th>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center tabular-nums">
                    {cell(plan, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Phones and tablets: one card per plan, the same rows. */}
      <ul aria-label={t("table.label")} className="grid gap-4 md:grid-cols-2 lg:hidden">
        {plans.map((plan) => (
          <li key={plan.id} className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-4">
            <div>
              <h2 className="text-[1.25rem] font-extrabold">{values.name(plan)}</h2>
              <p className="text-caption">{who(plan)}</p>
            </div>
            <dl className="flex flex-col divide-y divide-border text-caption">
              {PLAN_ROWS.map((row) => (
                <div key={row} className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-muted-foreground">{t(`rows.${row}`)}</dt>
                  <dd className="text-end font-semibold tabular-nums">{cell(plan, row)}</dd>
                </div>
              ))}
            </dl>
            {edit(plan, true)}
          </li>
        ))}
      </ul>

      <PlanEditor plan={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
