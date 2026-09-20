"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CarFront } from "lucide-react";

/** Car counts by status from getAnalytics().inventory. */
export type InventoryBreakdownData = {
  total: number;
  available: number;
  sold: number;
  unavailable: number;
};

// Module scope, so the identity is stable: built inside the component it was
// a fresh object every render, which made it useless as a memo dependency.
const STATUS_COLORS = {
  available: "#10b981", // emerald-500
  sold: "#3b82f6", // blue-500
  unavailable: "#94a3b8", // slate-400
};

const InventoryBreakdown = ({
  breakdown,
}: {
  breakdown: InventoryBreakdownData | null | undefined;
}) => {
  const t = useTranslations("org.dashboard.inventory");
  const tStatus = useTranslations("carAttributes.status");
  const { number } = useFormatters();

  const chartData = useMemo(() => {
    if (!breakdown) return [];
    return [
      { name: tStatus("AVAILABLE"), value: breakdown.available, fill: STATUS_COLORS.available },
      { name: tStatus("SOLD"), value: breakdown.sold, fill: STATUS_COLORS.sold },
      { name: tStatus("UNAVAILABLE"), value: breakdown.unavailable, fill: STATUS_COLORS.unavailable },
    ].filter(item => item.value > 0);
  }, [breakdown, tStatus]);

  const chartConfig = {
    available: {
      label: tStatus("AVAILABLE"),
      color: STATUS_COLORS.available,
    },
    sold: {
      label: tStatus("SOLD"),
      color: STATUS_COLORS.sold,
    },
    unavailable: {
      label: tStatus("UNAVAILABLE"),
      color: STATUS_COLORS.unavailable,
    },
  };

  if (!breakdown || breakdown.total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center h-[300px]">
          <div className="bg-muted rounded-full p-4 mb-4">
            <CarFront className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">{t("emptyTitle")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
            {t("emptyBody")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4 flex flex-col justify-center">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                strokeWidth={2}
                stroke="var(--background)"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              {/* Custom center text */}
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="fill-foreground font-bold text-3xl"
              >
                {number(breakdown.total)}
              </text>
              <text 
                x="50%" 
                y="62%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs"
              >
                {t("totalCars")}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Custom Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          {chartData.map((entry, index) => {
            const percentage = number(entry.value / breakdown.total, {
              style: "percent",
              maximumFractionDigits: 1,
            });
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.fill }}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{entry.name}</span>
                  <span className="text-micro text-muted-foreground">
                    {t("legend", { value: number(entry.value), percent: percentage })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryBreakdown;
