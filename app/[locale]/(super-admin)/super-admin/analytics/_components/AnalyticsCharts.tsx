"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

/** One month of the 6-month series assembled in page.tsx. */
export type AnalyticsMonth = {
  month: string;
  organizations: number;
  users: number;
  cars: number;
  testDrives: number;
};

/** Series colors; the labels are added per render, in the reader's language. */
const SERIES_COLORS = {
  organizations: "hsl(var(--chart-1))",
  users: "hsl(var(--chart-2))",
  cars: "hsl(var(--chart-3))",
  testDrives: "hsl(var(--chart-4))",
} as const;

export default function AnalyticsCharts({
  monthlyData,
}: {
  monthlyData: AnalyticsMonth[];
}) {
  const t = useTranslations("superAdmin.analytics.charts");
  const { number } = useFormatters();
  const chartConfig = Object.fromEntries(
    (Object.keys(SERIES_COLORS) as (keyof typeof SERIES_COLORS)[]).map((key) => [
      key,
      { label: t(`series.${key}`), color: SERIES_COLORS[key] },
    ])
  );
  // Axis ticks are formatted, not passed through: recharts prints a raw number,
  // which is Western digits beside every other figure on an Arabic page. The
  // axis *orientation* stays physical (see the i18n skill).
  const tick = (value: number) => number(value);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Growth Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t("growthTitle")}</CardTitle>
          <CardDescription>{t("growthSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={tick} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="organizations"
                  stackId="1"
                  stroke="var(--color-organizations)"
                  fill="var(--color-organizations)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="2"
                  stroke="var(--color-users)"
                  fill="var(--color-users)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Activity Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t("activityTitle")}</CardTitle>
          <CardDescription>{t("activitySubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={tick} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="cars"
                  fill="var(--color-cars)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="testDrives"
                  fill="var(--color-testDrives)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
