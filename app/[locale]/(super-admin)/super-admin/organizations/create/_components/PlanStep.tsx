"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { tenantHost } from "@/lib/utils/tenant-host";
import { cn } from "@/lib/utils";
import type { CreateDealershipState, Plan } from "./use-create-dealership";

/** The last step: the plan, then every answer to check, each a click from its step. */
export function PlanStep({
  plans,
  values,
  owner,
  set,
  goTo,
  place,
  planName,
}: { plans: Plan[] } & Pick<CreateDealershipState, "values" | "owner" | "set" | "goTo" | "place" | "planName">) {
  const t = useTranslations("superAdmin.organizations.form");
  const tPlan = useTranslations("superAdmin.organizations.details.plans");
  const fmt = useFormatters();

  return (
    <>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-caption text-muted-foreground">{t("plan.hint")}</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {plans.map((plan) => {
            const on = plan.id === values.planId;
            return (
              <label
                key={plan.id}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-[16px] border bg-field px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  on ? "border-2 border-[#1d4e9e] bg-[#f3f6fb]" : "border-border hover:bg-muted/40",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <input type="radio" name="plan" value={plan.id} checked={on} onChange={() => set("planId", plan.id)} className="size-[18px] accent-[#1d4e9e]" />
                  <span className="text-body font-bold">{planName(plan)}</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {plan.monthlyPrice > 0 ? tPlan("perMonthPrice", { amount: formatPlanAmount(plan.monthlyPrice, fmt.locale) }) : tPlan("free")}
                </span>
                <span className="text-micro text-muted-foreground">
                  {plan.maxCars < 0 ? tPlan("carsUnlimited") : tPlan("cars", { value: fmt.number(plan.maxCars) })}
                </span>
                <span className="text-micro text-muted-foreground">
                  {plan.maxMembers < 0 ? tPlan("peopleUnlimited") : tPlan("people", { value: fmt.number(plan.maxMembers) })}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="border-t border-border pt-5">
        <h3 className="text-body font-bold">{t("review.title")}</h3>
        <dl className="mt-3 flex flex-col">
          {(
            [
              ["name", values.name, 0],
              ["slug", tenantHost(values.slug), 0, true],
              ["where", [values.address, place()].filter(Boolean).join(fmt.locale === "ar" ? "، " : ". "), 0],
              ["about", values.description, 0],
              [
                "owner",
                values.ownerEmail &&
                  (owner.result?.hasAccount ? t("review.ownerExisting", { email: values.ownerEmail }) : t("review.ownerNew", { email: values.ownerEmail })),
                1,
              ],
              ["contact", [values.phone, values.email, values.website].filter(Boolean).join(fmt.locale === "ar" ? "، " : ", "), 1, true],
            ] as [string, string, number, boolean?][]
          ).map(([key, value, target, ltr]) => (
            <div key={key} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-start gap-3 border-b border-border py-2.5 text-caption last:border-b-0 sm:grid-cols-[minmax(0,10rem)_1fr_auto]">
              <dt className="text-muted-foreground">{t(`review.${key}`)}</dt>
              <dd className={cn("min-w-0 break-words", !value && "text-muted-foreground")} dir={ltr && value ? "ltr" : undefined}>
                {value || t("review.none")}
              </dd>
              <button
                type="button"
                onClick={() => goTo(target)}
                aria-label={t("review.changeLabel", { field: t(`review.${key}`) })}
                className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline"
              >
                {t("review.change")}
              </button>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
