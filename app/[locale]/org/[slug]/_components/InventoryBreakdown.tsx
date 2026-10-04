"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CarFront } from "lucide-react";
import { Panel, PanelEmpty } from "./Panel";
import { CAR_STATUS_TONE } from "./status-tones";

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
  available: CAR_STATUS_TONE.AVAILABLE.color,
  sold: CAR_STATUS_TONE.SOLD.color,
  unavailable: CAR_STATUS_TONE.UNAVAILABLE.color,
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
      <Panel title={t("title")} description={t("description")} className="h-full">
        <PanelEmpty icon={CarFront} title={t("emptyTitle")} body={t("emptyBody")} />
      </Panel>
    );
  }

  return (
    <Panel title={t("title")} description={t("description")} className="h-full" bodyClassName="justify-center">
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
                stroke="var(--card)"
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
                className="fill-foreground text-3xl font-black"
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
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
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
                  <span className="text-caption font-semibold">{entry.name}</span>
                  <span className="text-micro text-muted-foreground">
                    {t("legend", { value: number(entry.value), percent: percentage })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
    </Panel>
  );
};

export default InventoryBreakdown;
