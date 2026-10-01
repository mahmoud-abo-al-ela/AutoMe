"use client";

import { useTranslations } from "next-intl";
import { CreditCard, ShieldCheck, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormatters } from "@/hooks/use-formatters";
import type { BillingPayment } from "./_lib/billing-types";

/**
 * How the dealership last paid. There is no card on file to manage: each
 * payment is made on Paymob's page, so this only reports the last one.
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-16 items-center justify-center rounded-lg border bg-muted/40">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            {payment?.paidAt ? (
              <div>
                <p className="text-sm font-medium">{how}</p>
                <p className="text-xs text-muted-foreground">
                  {t("lastPaid", { date: date(payment.paidAt, { month: "long" }) })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("none")}</p>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            {t("securedBy")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
