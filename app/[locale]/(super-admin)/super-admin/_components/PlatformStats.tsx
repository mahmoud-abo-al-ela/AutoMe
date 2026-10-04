import {
  Building2,
  Users,
  Car,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";

/**
 * One row of the "active subscriptions by plan" breakdown built in page.tsx.
 * `plan` is null when the subscription points at a plan that no longer exists.
 */
export type SubscriptionBreakdownItem = { plan: string | null; count: number };

export default function PlatformStats({
  totalOrganizations,
  activeOrganizations,
  totalUsers,
  totalCars,
  totalTestDrives,
  subscriptionBreakdown,
}: {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalCars: number;
  totalTestDrives: number;
  subscriptionBreakdown: SubscriptionBreakdownItem[];
}) {
  const t = useTranslations("superAdmin.overview");
  const tCommon = useTranslations("superAdmin.common");
  const locale = useLocale() as Locale;
  const number = (value: number) => formatNumber(value, locale);

  const stats = [
    {
      key: "organizations",
      title: t("stats.organizations"),
      value: totalOrganizations,
      subtitle: t("stats.organizationsActive", {
        value: number(activeOrganizations),
      }),
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      key: "users",
      title: t("stats.users"),
      value: totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      key: "cars",
      title: t("stats.cars"),
      value: totalCars,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      key: "testDrives",
      title: t("stats.testDrives"),
      value: totalTestDrives,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{number(stat.value)}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            {t("subscriptions.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {subscriptionBreakdown.length > 0 ? (
              subscriptionBreakdown.map((item, index) => (
                <div
                  key={item.plan ?? `unknown-${index}`}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg"
                >
                  <span className="font-medium">
                    {item.plan ?? tCommon("unknown")}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    {t("subscriptions.orgCount", {
                      count: item.count,
                      value: number(item.count),
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("subscriptions.empty")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
