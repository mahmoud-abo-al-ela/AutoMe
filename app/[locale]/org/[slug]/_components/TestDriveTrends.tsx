"use client";
import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Timer } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Panel, PanelEmpty } from "./Panel";
import { RangeSelect } from "./OverviewChart";

/** One day of the test-drive trend series, split by status. */
export type TestDriveTrendPoint = {
  date: string;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
};

// Stacked bottom to top. Each status has the colour it has everywhere in the
// dashboard: waiting is marker yellow, confirmed plate blue, completed green,
// cancelled brick.
const STATUSES = ["completed", "confirmed", "pending", "cancelled"] as const;
const STATUS_COLOR = {
  completed: "var(--positive)",
  confirmed: "var(--primary)",
  pending: "var(--marker)",
  cancelled: "var(--destructive)",
} as const;

const TestDriveTrends = ({ data }: { data: TestDriveTrendPoint[] }) => {
  const t = useTranslations("org.dashboard");
  // The four statuses are already named for the public test-drive surface.
  const tStatus = useTranslations("testDrive.status");
  const [timeRange, setTimeRange] = useState("30d");

  const filteredData = useMemo(() => {
    if (!data) return [];
    const days = { "7d": 7, "14d": 14, "30d": 30 }[timeRange] ?? 30;
    const cutoff = Date.now() - days * 86_400_000;
    return data
      .filter((item) => new Date(item.date).getTime() >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, timeRange]);

  const { date: formatDateFor, number } = useFormatters();
  const chartDate = (value: string | number | Date) =>
    formatDateFor(value, { day: "numeric", month: "short", year: undefined });

  const chartConfig = Object.fromEntries(
    STATUSES.map((key) => [key, { label: tStatus(key.toUpperCase()), color: STATUS_COLOR[key] }]),
  );

  if (!data || data.length === 0) {
    return (
      <Panel title={t("trends.title")} description={t("trends.emptyDescription")}>
        <PanelEmpty icon={Timer} title={t("trends.emptyTitle")} body={t("trends.emptyBody")} />
      </Panel>
    );
  }

  return (
    <Panel
      title={t("trends.title")}
      description={t("trends.description")}
      actions={
        <RangeSelect
          value={timeRange}
          onChange={setTimeRange}
          label={t("ranges.label")}
          options={[
            { value: "7d", label: t("ranges.last7") },
            { value: "14d", label: t("ranges.last14") },
            { value: "30d", label: t("ranges.last30") },
          ]}
        />
      }
      bodyClassName="px-2 sm:px-6"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              {STATUSES.map((key) => (
                <linearGradient key={key} id={`fill-drive-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.04} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => chartDate(new Date(value))}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              tickFormatter={(value: number) => number(value)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={(value) => chartDate(value)} indicator="dot" />}
            />
            {STATUSES.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                fill={`url(#fill-drive-${key})`}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Panel>
  );
};

export default TestDriveTrends;
