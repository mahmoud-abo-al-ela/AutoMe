"use client";
import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** One day of the overview series from getOverviewChartData(). */
export type OverviewPoint = {
  date: string;
  cars: number;
  users: number;
  testDrives: number;
};

const OverviewChart = ({ data }: { data: OverviewPoint[] }) => {
  const t = useTranslations("org.dashboard");
  const [timeRange, setTimeRange] = useState("7d");

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (!data) return [];

    const now = new Date();
    let cutoffDate;

    if (timeRange === "7d") {
      cutoffDate = new Date(now.setDate(now.getDate() - 7));
    } else if (timeRange === "30d") {
      cutoffDate = new Date(now.setDate(now.getDate() - 30));
    } else {
      cutoffDate = new Date(now.setDate(now.getDate() - 90));
    }

    const filtered = data
      .filter((item) => new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filtered;
  }, [data, timeRange]);

  // ChartConfig treats `color` and `theme` as mutually exclusive, which matches
  // ChartStyle: it emits `theme?.[mode] || color`, so a theme always wins. Each
  // entry here set both to the same hex, making `color` dead — dropped rather
  // than kept as a value that could silently diverge from the theme.
  // Chart axis and tooltip labels follow the reader's locale; the axis
  // *orientation* stays physical (see the i18n skill).
  const { date: formatDateFor, number } = useFormatters();
  const chartDate = (value: string | number | Date) =>
    formatDateFor(value, { day: "numeric", month: "short", year: undefined });

  const chartConfig = {
    users: {
      theme: {
        light: "#3b82f6",
        dark: "#3b82f6",
      },
      label: t("overview.series.users"),
    },
    cars: {
      theme: {
        light: "#10b981",
        dark: "#10b981",
      },
      label: t("overview.series.cars"),
    },
    testDrives: {
      theme: {
        light: "#9333ea",
        dark: "#9333ea",
      },
      label: t("overview.series.testDrives"),
    },
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("overview.title")}</CardTitle>
          <CardDescription>{t("overview.emptyDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">{t("overview.emptyBody")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <CardTitle>{t("overview.title")}</CardTitle>
            <CardDescription>{t("overview.description")}</CardDescription>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ms-auto sm:flex"
              aria-label={t("ranges.label")}
            >
              <SelectValue placeholder={t("ranges.last7")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                {t("ranges.last90")}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {t("ranges.last30")}
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                {t("ranges.last7")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillCars" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-cars)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-cars)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-users)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-users)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillTestDrives" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-testDrives)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-testDrives)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return chartDate(date);
                }}
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
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return chartDate(value);
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="users"
                type="natural"
                fill="url(#fillUsers)"
                stroke="var(--color-users)"
                stackId="a"
              />
              <Area
                dataKey="cars"
                type="natural"
                fill="url(#fillCars)"
                stroke="var(--color-cars)"
                stackId="a"
              />
              <Area
                dataKey="testDrives"
                type="natural"
                fill="url(#fillTestDrives)"
                stroke="var(--color-testDrives)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default OverviewChart;
