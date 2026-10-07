"use client";

import { useTranslations } from "next-intl";
import { CreditCard, ShieldCheck, Smartphone } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { SectionPanel } from "../../_components/SectionPanel";
import type { BillingPayment } from "./_lib/billing-types";

/**
 * How the dealership pays. There is no card on file to manage: each payment
 * is made on Paymob's page, so this reports how the last one was made.
 */
export default function LastPayment({ payment }: { payment: BillingPayment | null }) {
  const t = useTranslations("org.billing.payment");
  const { date } = useFormatters();

  const wallet = payment?.method === "wallet";
  const Icon = wallet ? Smartphone : CreditCard;
  // Paymob reports a card's last four digits, but a wallet's whole phone number.
  const last4 = payment?.maskedPan?.replace(/\D/g, "").slice(-4);
  const how = wallet ? t("wallet") : last4 ? t("card", { last4 }) : t("other");

  return (
    <SectionPanel title={t("title")}>
      <div className="flex flex-col gap-3">
        {payment?.paidAt ? (
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-control border border-border bg-background">
              <Icon aria-hidden className="size-5 text-muted-foreground" />
            </span>
            <span className="flex flex-col">
              <span className="font-semibold">{how}</span>
              <span className="text-caption text-muted-foreground">{t("lastPaid", { date: date(payment.paidAt, { month: "long" }) })}</span>
            </span>
          </div>
        ) : (
          <p className="text-caption text-muted-foreground">{t("none")}</p>
        )}
        <p className="flex items-start gap-2 text-caption text-muted-foreground">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-positive" />
          {t("subtitle")}
        </p>
      </div>
    </SectionPanel>
  );
}
