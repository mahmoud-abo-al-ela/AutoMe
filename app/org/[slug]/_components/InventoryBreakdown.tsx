"use client";

import React, { useMemo } from "react";
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

const InventoryBreakdown = ({
  breakdown,
}: {
  breakdown: InventoryBreakdownData | null | undefined;
}) => {
  const STATUS_COLORS = {
    available: "#10b981", // emerald-500
    sold: "#3b82f6", // blue-500
    unavailable: "#94a3b8", // slate-400
  };

  const chartData = useMemo(() => {
    if (!breakdown) return [];
    return [
      { name: "Available", value: breakdown.available, fill: STATUS_COLORS.available },
      { name: "Sold", value: breakdown.sold, fill: STATUS_COLORS.sold },
      { name: "Unavailable", value: breakdown.unavailable, fill: STATUS_COLORS.unavailable },
    ].filter(item => item.value > 0);
  }, [breakdown]);

  const chartConfig = {
    available: {
      label: "Available",
      color: STATUS_COLORS.available,
    },
    sold: {
      label: "Sold",
      color: STATUS_COLORS.sold,
    },
    unavailable: {
      label: "Unavailable",
      color: STATUS_COLORS.unavailable,
    },
  };

  if (!breakdown || breakdown.total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>Breakdown by availability</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center h-[300px]">
          <div className="bg-muted rounded-full p-4 mb-4">
            <CarFront className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">No inventory yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
            Add cars to see your inventory breakdown.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle>Inventory Status</CardTitle>
        <CardDescription>Breakdown by availability</CardDescription>
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
                {breakdown.total}
              </text>
              <text 
                x="50%" 
                y="62%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs"
              >
                Total Cars
              </text>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Custom Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          {chartData.map((entry, index) => {
            const percentage = ((entry.value / breakdown.total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.fill }}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{entry.name}</span>
                  <span className="text-[10px] text-muted-foreground">{entry.value} ({percentage}%)</span>
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
