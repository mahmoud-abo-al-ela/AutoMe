"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { SectionPanel } from "../../_components/SectionPanel";
import type { BillingPayment } from "./_lib/billing-types";

/** The few most recent payments show; the rest open on request. */
const SHOWN = 4;

const STATUS_STYLES: Record<BillingPayment["status"], string> = {
  PAID: "bg-positive-soft text-positive",
  FAILED: "bg-destructive-soft text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
  PENDING: "bg-[#fff1c2] text-[#8a5e00]",
  EXPIRED: "bg-muted text-muted-foreground",
};

/** The dealership's payments to AutoMe, newest first: paid, failed and refunded. */
export default function PaymentHistory({ payments }: { payments: BillingPayment[] }) {
  const t = useTranslations("org.billing.payments");
  const tPlans = useTranslations("plans");
  const { date, number, locale } = useFormatters();
  const [all, setAll] = useState(false);
  const shown = all ? payments : payments.slice(0, SHOWN);

  const planName = (plan: BillingPayment["plan"]) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };

  return (
    <SectionPanel title={t("title")}>
      {payments.length === 0 ? (
        <p className="text-caption text-muted-foreground">{t("emptyBody")}</p>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-border">
            {shown.map((payment) => (
              <li key={payment.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-col">
                  <span className="text-body">
                    {t(`purposes.${payment.purpose}`, { plan: planName(payment.plan), period: payment.billingPeriod })}
                  </span>
                  {/* A paid period says what was bought; anything else, when it was tried. */}
                  <span className="text-caption text-muted-foreground">
                    {payment.status === "PAID" && payment.periodStart && payment.periodEnd
                      ? t("period", { start: date(payment.periodStart), end: date(payment.periodEnd) })
                      : date(payment.paidAt ?? payment.createdAt, { month: "long" })}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <b className={cn("font-semibold tabular-nums", payment.status !== "PAID" && "text-muted-foreground")}>
                    {formatPlanAmount(payment.amountCents, locale)}
                  </b>
                  <span className={cn("rounded-full px-2 py-px text-micro font-bold", STATUS_STYLES[payment.status])}>
                    {t(`statuses.${payment.status}`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {payments.length > SHOWN && (
            <button
              type="button"
              onClick={() => setAll(!all)}
              aria-expanded={all}
              className="mt-3 inline-flex min-h-11 cursor-pointer items-center text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline"
            >
              {all ? t("showFewer") : t("showAll", { count: payments.length, value: number(payments.length) })}
            </button>
          )}
        </>
      )}
    </SectionPanel>
  );
}
