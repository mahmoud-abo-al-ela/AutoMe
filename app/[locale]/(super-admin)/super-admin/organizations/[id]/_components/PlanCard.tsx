"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SectionPanel } from "@/components/dashboard/SectionPanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { changeOrganizationPlan } from "@/actions/super-admin";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";

type Plan = { id: string; type: string; name: string; monthlyPrice: number };

function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
  const t = useTranslations("superAdmin.organizations.details.plan");
  const fmt = useFormatters();
  // A negative limit means none: the count alone, no bar.
  const unlimited = limit < 0;
  const share = limit > 0 ? Math.min(1, used / limit) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-caption">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">
          {unlimited ? t("usageUnlimited", { used: fmt.number(used) }) : t("usage", { used: fmt.number(used), limit: fmt.number(limit) })}
        </span>
      </div>
      <span aria-hidden className={unlimited ? "hidden" : "h-2 overflow-hidden rounded-full bg-muted"}>
        <span className={share >= 1 ? "block h-full rounded-full bg-destructive" : "block h-full rounded-full bg-chart-1"} style={{ width: `${share * 100}%` }} />
      </span>
    </div>
  );
}

/**
 * The dealership's plan: what it is on, what it costs, when it is paid until,
 * and how much of the plan's cars and team it uses. "Change plan" opens a
 * choice of plans in place; the change applies straight away.
 */
export function PlanCard({ data, plans }: { data: DealershipDetail; plans: Plan[] }) {
  const t = useTranslations("superAdmin.organizations.details.plan");
  const tSub = useTranslations("superAdmin.organizations.details.subscription");
  const tCommon = useTranslations("superAdmin.common");
  const tPlans = useTranslations("plans");
  const tActions = useTranslations("common.actions");
  const actionError = useActionError();
  const fmt = useFormatters();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [changing, setChanging] = useState(false);
  const [saving, setSaving] = useState(false);
  const sub = data.subscription;
  const [chosen, setChosen] = useState(sub?.plan.id ?? "");

  const name = (plan: { type: string; name: string }) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };
  const day = (iso: string) => fmt.date(iso);
  const amount = (minor: number) => formatPlanAmount(minor, fmt.locale);

  const save = async () => {
    if (!chosen || chosen === sub?.plan.id) return setChanging(false);
    setSaving(true);
    try {
      const result = await changeOrganizationPlan(data.dealership.id, chosen);
      const plan = plans.find((p) => p.id === chosen);
      if (result.success) {
        toast.success(tSub("updated"), { description: plan ? tSub("updatedBody", { plan: name(plan) }) : undefined });
        setChanging(false);
        startTransition(() => router.refresh());
      } else {
        toast.error(tSub("updateFailed"), { description: actionError(result.error, tCommon("errorBody")) });
      }
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setSaving(false);
    }
  };

  const rows: [string, string][] = sub
    ? [
        [t("plan"), t(sub.billingPeriod === "YEARLY" ? "yearly" : "monthly", { plan: name(sub.plan) })],
        [
          t("price"),
          sub.billingPeriod === "YEARLY" ? t("perYear", { amount: amount(sub.plan.yearlyPrice) }) : t("perMonth", { amount: amount(sub.plan.monthlyPrice) }),
        ],
        ...(sub.status === "TRIALING" && sub.trialEndsAt
          ? ([[t("trialEnds"), day(sub.trialEndsAt)]] as [string, string][])
          : sub.periodEnd
            ? ([[sub.cancelAtPeriodEnd ? t("cancels") : t("paidUntil"), day(sub.periodEnd)]] as [string, string][])
            : []),
      ]
    : [[t("plan"), t("free")]];

  return (
    <SectionPanel
      title={t("title")}
      action={
        !changing && (
          <button type="button" onClick={() => setChanging(true)} className="text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
            {t("change")}
          </button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {changing ? (
          <div className="flex flex-col gap-2">
            <Select value={chosen} onValueChange={setChosen}>
              <SelectTrigger aria-label={tSub("selectPlan")} className="h-11 data-[size=default]:h-11 rounded-control border-[#8c8170] bg-field">
                <SelectValue placeholder={tSub("selectPlan")} />
              </SelectTrigger>
              <SelectContent className="rounded-control">
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {tCommon("planOption", { name: name(plan), amount: amount(plan.monthlyPrice) })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="inverse" size="control" className="h-10" disabled={saving || !chosen} onClick={save}>
                {saving ? tSub("updating") : tSub("update")}
              </Button>
              <Button variant="outline-strong" size="control" className="h-10 bg-field" disabled={saving} onClick={() => setChanging(false)}>
                {tActions("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-[minmax(0,8rem)_1fr] gap-x-3 gap-y-2 text-caption">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {sub && (
          <>
            <Usage label={t("cars")} used={data.counts.cars} limit={sub.plan.maxCars} />
            <Usage label={t("team")} used={data.counts.team} limit={sub.plan.maxMembers} />
          </>
        )}
      </div>
    </SectionPanel>
  );
}
