import { TrendingUp, TrendingDown, Building2, Users, Car } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Month-over-month counts for one entity, as computed in page.tsx. */
export type GrowthMetric = {
  current: number;
  previous: number;
  /** Percentage change vs last month; 0 when last month was empty. */
  change: number;
};

export default function GrowthMetrics({
  growth,
}: {
  growth: { organizations: GrowthMetric; users: GrowthMetric; cars: GrowthMetric };
}) {
  const t = useTranslations("superAdmin.analytics.growth");
  const locale = useLocale() as Locale;
  const number = (value: number, options?: Intl.NumberFormatOptions) =>
    formatNumber(value, locale, options);

  const metrics = [
    {
      key: "organizations",
      title: t("organizations"),
      ...growth.organizations,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      key: "users",
      title: t("users"),
      ...growth.users,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      key: "cars",
      title: t("cars"),
      ...growth.cars,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => {
        const isPositive = metric.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={metric.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{number(metric.current)}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon
                  className={`h-4 w-4 ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {/* A percent style on the fraction, not a literal "%", so
                      the sign and symbol land where Arabic puts them. */}
                  {number(metric.change / 100, {
                    style: "percent",
                    signDisplay: "exceptZero",
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("vsLastMonth", { value: number(metric.previous) })}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
