import { Banknote, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPlanAmount } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";

export default function SubscriptionStats({
  stats,
  mrr,
}: {
  /** Subscription counts keyed by SubscriptionStatus, built in page.tsx. */
  stats: Record<string, number>;
  /** Monthly recurring revenue, in minor units. */
  mrr: number;
}) {
  const t = useTranslations("superAdmin.plans.stats");
  const locale = useLocale() as Locale;
  const count = (value: number) => formatNumber(value, locale);

  const statCards = [
    {
      key: "mrr",
      title: t("mrr"),
      value: formatPlanAmount(mrr, locale),
      icon: Banknote,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      key: "active",
      title: t("active"),
      value: count(stats.ACTIVE || 0),
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      key: "trial",
      title: t("trial"),
      value: count(stats.TRIALING || 0),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      key: "churned",
      title: t("churned"),
      // SubscriptionStatus spells it CANCELED and has no EXPIRED; this read
      // CANCELLED + EXPIRED, so the card always showed 0.
      value: count(stats.CANCELED || 0),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
