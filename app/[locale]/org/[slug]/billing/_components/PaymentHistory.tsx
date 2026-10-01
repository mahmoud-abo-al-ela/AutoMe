"use client";

import { useTranslations } from "next-intl";
import { FileText, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import type { BillingPayment } from "./_lib/billing-types";

const STATUS_STYLES: Record<BillingPayment["status"], string> = {
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  EXPIRED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

/** The dealership's payments to AutoMe, newest first: paid, failed and refunded. */
export default function PaymentHistory({ payments }: { payments: BillingPayment[] }) {
  const t = useTranslations("org.billing.payments");
  const tPlans = useTranslations("plans");
  const { date, locale } = useFormatters();

  const planName = (plan: BillingPayment["plan"]) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <EmptyState variant="inline" icon={Receipt} title={t("emptyTitle")} description={t("emptyBody")} />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">{date(payment.paidAt ?? payment.createdAt)}</TableCell>
                    <TableCell>
                      {t(`purposes.${payment.purpose}`, {
                        plan: planName(payment.plan),
                        period: payment.billingPeriod,
                      })}
                      {payment.status === "PAID" && payment.periodStart && payment.periodEnd && (
                        <span className="block text-xs text-muted-foreground">
                          {t("period", { start: date(payment.periodStart), end: date(payment.periodEnd) })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatPlanAmount(payment.amountCents, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLES[payment.status]}>{t(`statuses.${payment.status}`)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
