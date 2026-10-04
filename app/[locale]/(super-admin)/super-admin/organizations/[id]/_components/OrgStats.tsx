import { Car, Users, Calendar } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrganizationDetail } from "./OrgDetailsHeader";

export default function OrgStats({ org }: { org: OrganizationDetail }) {
  const t = useTranslations("superAdmin.organizations.details.stats");
  const locale = useLocale() as Locale;

  const stats = [
    {
      key: "cars",
      title: t("cars"),
      value: org._count.cars,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      key: "members",
      title: t("members"),
      value: org.memberships.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      key: "testDrives",
      title: t("testDrives"),
      value: org._count.testDrives,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
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
            <div className="text-2xl font-bold">
              {formatNumber(stat.value, locale)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
