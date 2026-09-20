import React from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Users, CarFront, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";

/** Headline counts from getDashboardStats(). */
export type DashboardStats = {
  users: number;
  cars: number;
  testDrives: number;
};

const StatsCards = async ({ data }: { data: DashboardStats | null }) => {
  const t = await getTranslations("org.dashboard.stats");
  const locale = (await getLocale()) as Locale;

  const stats = [
    {
      key: "users",
      title: t("users"),
      value: data?.users || 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      key: "cars",
      title: t("cars"),
      value: data?.cars || 0,
      icon: CarFront,
      color: "bg-green-500",
    },
    {
      key: "testDrives",
      title: t("testDrives"),
      value: data?.testDrives || 0,
      icon: Timer,
      color: "bg-purple-500",
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.key} className="p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {stat.title}
                </p>
                {/* Through the formatter, not bare: the Arabic UI renders
                    Eastern numerals, and a raw `{value}` would have been the
                    one Western digit on the card. */}
                <p className="text-2xl font-bold">
                  {formatNumber(stat.value, locale)}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
