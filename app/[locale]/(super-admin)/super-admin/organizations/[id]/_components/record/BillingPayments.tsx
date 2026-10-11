"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import { PAYMENT_TONES, panel, td, th } from "./record-styles";
import { usePlanName } from "../../../../_components/use-plan-name";

type Payment = Extract<DealershipDetail, { payments: unknown }>["payments"][number];

/** The Billing tab's payment history: what was paid, when, how, and the result. */
export function BillingPayments({ payments, paidCents }: { payments: Payment[]; paidCents: number }) {
  const t = useTranslations("superAdmin.organizations.details.billing");
  const tPlan = useTranslations("superAdmin.organizations.details.plans");
  const tPayments = useTranslations("org.billing.payments");
  const fmt = useFormatters();
  const planName = usePlanName();
  const amount = (minor: number) => formatPlanAmount(minor, fmt.locale);
  const method = (p: Payment) =>
    p.maskedPan
      ? t("card", { last4: p.maskedPan.slice(-4) })
      : p.method === "wallet"
        ? t("wallet")
        : t("unknownMethod");

  return (
    <section aria-labelledby="payments" className={panel}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <h2 id="payments" className="text-[1.25rem] font-extrabold">
          {t("payments")}
        </h2>
        {paidCents > 0 && (
          <span className="text-caption text-muted-foreground">
            {tPlan("paidSoFar", { amount: amount(paidCents) })}
          </span>
        )}
      </header>
      {payments.length === 0 ? (
        <p className="border-t border-border px-4 py-5 text-caption text-muted-foreground sm:px-5">
          {t("empty")}
        </p>
      ) : (
        <>
          {/* Phones: one row per payment, the amount and result first. */}
          <ul className="flex flex-col border-t border-border lg:hidden">
            {payments.map((p) => (
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
                {payments.map((p) => (
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
  );
}
