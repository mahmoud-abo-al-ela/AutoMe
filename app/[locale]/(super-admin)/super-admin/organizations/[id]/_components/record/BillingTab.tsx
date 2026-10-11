"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { planKeyFor } from "@/lib/constants/plans";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { changeOrganizationPlan } from "@/actions/super-admin";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import { PAYMENT_TONES, panel, td, th } from "./record-styles";

/**
 * The Billing tab (canvas: dealership tabs round 1, "Billing C · Plans
 * first"): the plans side by side with the current one marked and where it
 * stands, a move to any other — which asks first — then every payment.
 */
export function BillingTab({
  data,
}: {
  data: Extract<DealershipDetail, { payments: unknown }>;
}) {
  const t = useTranslations("superAdmin.organizations.details.billing");
  const tPlan = useTranslations("superAdmin.organizations.details.plans");
  const tSub = useTranslations("superAdmin.organizations.details.subscription");
  const tCommon = useTranslations("superAdmin.common");
  const tPayments = useTranslations("org.billing.payments");
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const actionError = useActionError();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [moving, setMoving] = useState<(typeof data.plans)[number] | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const { subscription: sub, dealership: org, counts } = data;
  const currentType = sub?.plan.type ?? "STARTER";
  const planName = (plan: { type: string; name: string }) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };
  const amount = (minor: number) => formatPlanAmount(minor, fmt.locale);
  const day = (iso: string) => fmt.date(iso, { year: undefined });
  const longDay = (date: string) =>
    fmt.date(`${date}T00:00:00Z`, {
      month: "long",
      year: undefined,
      timeZone: "UTC",
    });
  const method = (p: (typeof data.payments)[number]) =>
    p.maskedPan
      ? t("card", { last4: p.maskedPan.slice(-4) })
      : p.method === "wallet"
        ? t("wallet")
        : t("unknownMethod");

  const standing = (() => {
    if (!sub) return null;
    if (sub.status === "PAST_DUE")
      return {
        tone: "text-destructive",
        text: tPlan("unpaid", {
          date: sub.pastDueSince ? day(sub.pastDueSince) : "",
          drops: sub.dropsOn ? longDay(sub.dropsOn) : "",
        }),
      };
    if (sub.status === "TRIALING" && sub.trialEndsAt)
      return {
        tone: "text-[#7a5200]",
        text: tPlan("trial", { date: day(sub.trialEndsAt) }),
      };
    if (sub.periodEnd)
      return {
        tone: "text-muted-foreground",
        text: sub.cancelAtPeriodEnd
          ? tPlan("cancels", { date: day(sub.periodEnd) })
          : tPlan("paidUntil", { date: day(sub.periodEnd) }),
      };
    return null;
  })();

  const move = async () => {
    if (!moving) return;
    setSaving(true);
    try {
      const result = await changeOrganizationPlan(org.id, moving.id);
      if (result.success) {
        toast.success(tSub("updated"), {
          description: tSub("updatedBody", { plan: planName(moving) }),
        });
        startTransition(() => router.refresh());
      } else {
        toast.error(tSub("updateFailed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setSaving(false);
      setMoving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="plans" className="flex flex-col gap-3">
        <h2 id="plans" className="sr-only">
          {tPlan("title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {data.plans.map((plan) => {
            const current = plan.type === currentType;
            return (
              <article
                key={plan.id}
                className={cn(
                  "flex flex-col gap-2 rounded-[20px] border bg-card px-5 py-4",
                  current ? "border-2 border-[#1d4e9e]" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[1.25rem] font-extrabold">
                    {planName(plan)}
                  </h3>
                  {current && (
                    <span className="rounded-full bg-[#e7eef8] px-2.5 py-0.5 text-micro font-bold text-[#1d4e9e]">
                      {tPlan("current")}
                    </span>
                  )}
                </div>
                <p className="text-[1.25rem] font-extrabold tabular-nums">
                  {plan.monthlyPrice > 0
                    ? tPlan("perMonthPrice", {
                        amount: amount(plan.monthlyPrice),
                      })
                    : tPlan("free")}
                </p>
                <ul className="flex flex-col gap-0.5 text-caption text-muted-foreground">
                  {/* A negative limit means none. */}
                  <li>
                    {plan.maxCars < 0
                      ? tPlan("carsUnlimited")
                      : tPlan("cars", { value: fmt.number(plan.maxCars) })}
                  </li>
                  <li>
                    {plan.maxMembers < 0
                      ? tPlan("peopleUnlimited")
                      : tPlan("people", { value: fmt.number(plan.maxMembers) })}
                  </li>
                  <li>
                    {tPlan("photos", {
                      value: fmt.number(plan.maxImagesPerCar),
                    })}
                  </li>
                </ul>
                <div className="mt-auto pt-2">
                  {current ? (
                    standing && (
                      <p
                        className={cn(
                          "text-caption font-semibold",
                          standing.tone,
                        )}
                      >
                        {standing.text}
                      </p>
                    )
                  ) : (
                    <Button
                      variant="outline-strong"
                      size="sm"
                      className="h-10 w-full bg-field"
                      onClick={() => setMoving(plan)}
                    >
                      {tPlan("moveTo", { plan: planName(plan) })}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="payments" className={panel}>
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 id="payments" className="text-[1.25rem] font-extrabold">
            {t("payments")}
          </h2>
          {counts.paidCents > 0 && (
            <span className="text-caption text-muted-foreground">
              {tPlan("paidSoFar", { amount: amount(counts.paidCents) })}
            </span>
          )}
        </header>
        {data.payments.length === 0 ? (
          <p className="border-t border-border px-4 py-5 text-caption text-muted-foreground sm:px-5">
            {t("empty")}
          </p>
        ) : (
          <>
            {/* Phones: one row per payment, the amount and result first. */}
            <ul className="flex flex-col border-t border-border lg:hidden">
              {data.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold tabular-nums">
                      {amount(p.amountCents)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-micro font-bold",
                        PAYMENT_TONES[p.status] ?? PAYMENT_TONES.EXPIRED,
                      )}
                    >
                      {tPayments(`statuses.${p.status}`)}
                    </span>
                  </div>
                  <p className="text-caption">
                    {tPayments(`purposes.${p.purpose}`, {
                      plan: planName(p.plan),
                      period: p.billingPeriod,
                    })}
                  </p>
                  <p className="text-micro text-muted-foreground">
                    {fmt.date(p.paidAt ?? p.createdAt)}
                    {fmt.locale === "ar" ? "، " : ", "}
                    {method(p)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="relative hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[720px] border-collapse text-caption">
                <thead>
                  <tr className="whitespace-nowrap border-y border-border bg-muted/60 text-muted-foreground">
                    <th scope="col" className={th}>
                      {t("date")}
                    </th>
                    <th scope="col" className={th}>
                      {t("what")}
                    </th>
                    <th scope="col" className={th}>
                      {t("amount")}
                    </th>
                    <th scope="col" className={th}>
                      {t("method")}
                    </th>
                    <th scope="col" className={th}>
                      {t("result")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className={cn(td, "whitespace-nowrap")}>
                        {fmt.date(p.paidAt ?? p.createdAt)}
                      </td>
                      <td className={td}>
                        {tPayments(`purposes.${p.purpose}`, {
                          plan: planName(p.plan),
                          period: p.billingPeriod,
                        })}
                      </td>
                      <td className={cn(td, "tabular-nums")}>
                        {amount(p.amountCents)}
                      </td>
                      <td className={td}>{method(p)}</td>
                      <td className={td}>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-micro font-bold",
                            PAYMENT_TONES[p.status] ?? PAYMENT_TONES.EXPIRED,
                          )}
                        >
                          {tPayments(`statuses.${p.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <AlertDialog
        open={moving !== null}
        onOpenChange={(open) => !open && !saving && setMoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {moving &&
                tPlan("dialogTitle", {
                  name: org.name,
                  plan: planName(moving),
                })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tPlan("dialogBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={saving}>
              {tPlan("dialogKeep")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                move();
              }}
            >
              {saving
                ? tPlan("moving")
                : moving && tPlan("dialogConfirm", { plan: planName(moving) })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
