"use client";
import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, PanelEmpty } from "./Panel";

/** One day of the overview series from getOverviewChartData(). */
export type OverviewPoint = {
  date: string;
  cars: number;
  users: number;
  testDrives: number;
};

/** The range control shared by the dashboard's charts. */
export function RangeSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-10 w-[160px] rounded-control bg-field">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-control">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Brand colours (globals.css, work mode): plate blue, marker yellow, and the
// positive green — distinct at a glance and the same everywhere in the app.
const SERIES = ["users", "cars", "testDrives"] as const;
const SERIES_COLOR = {
  users: "var(--chart-1)",
  cars: "var(--chart-2)",
  testDrives: "var(--chart-3)",
} as const;

const OverviewChart = ({ data }: { data: OverviewPoint[] }) => {
  const t = useTranslations("org.dashboard");
  const [timeRange, setTimeRange] = useState("7d");

  const filteredData = useMemo(() => {
    if (!data) return [];
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 86_400_000;
    return data
      .filter((item) => new Date(item.date).getTime() >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, timeRange]);

  // Chart axis and tooltip labels follow the reader's locale; the axis
  // *orientation* stays physical (see the i18n skill).
  const { date: formatDateFor, number } = useFormatters();
  const chartDate = (value: string | number | Date) =>
    formatDateFor(value, { day: "numeric", month: "short", year: undefined });

  const chartConfig = Object.fromEntries(
    SERIES.map((key) => [key, { label: t(`overview.series.${key}`), color: SERIES_COLOR[key] }]),
  );

  if (!data || data.length === 0) {
    return (
      <Panel title={t("overview.title")} description={t("overview.emptyDescription")}>
        <PanelEmpty icon={BarChart3} title={t("overview.emptyBody")} />
      </Panel>
    );
  }

  return (
    <Panel
      title={t("overview.title")}
      description={t("overview.description")}
      actions={
        <RangeSelect
          value={timeRange}
          onChange={setTimeRange}
          label={t("ranges.label")}
          options={[
            { value: "7d", label: t("ranges.last7") },
            { value: "30d", label: t("ranges.last30") },
            { value: "90d", label: t("ranges.last90") },
          ]}
        />
      }
      bodyClassName="px-2 sm:px-6"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              {SERIES.map((key) => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
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
            {SERIES.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                fill={`url(#fill-${key})`}
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

export default OverviewChart;
