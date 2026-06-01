"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timer } from "lucide-react";

const TestDriveTrends = ({ data }) => {
  const [timeRange, setTimeRange] = useState("30d");

  const filteredData = useMemo(() => {
    if (!data) return [];
    
    const daysMap = { "7d": 7, "14d": 14, "30d": 30 };
    const days = daysMap[timeRange] || 30;
    const cutoffDate = new Date(Date.now() - days * 86400000);

    return data
      .filter((item) => new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data, timeRange]);

  const chartConfig = {
    completed: {
      label: "Completed",
      color: "#10b981", // emerald-500
    },
    confirmed: {
      label: "Confirmed",
      color: "#3b82f6", // blue-500
    },
    pending: {
      label: "Pending",
      color: "#f59e0b", // amber-500
    },
    cancelled: {
      label: "Cancelled",
      color: "#ef4444", // red-500
    },
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Drive Trends</CardTitle>
          <CardDescription>Volume over time</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center h-[300px]">
          <div className="bg-muted rounded-full p-4 mb-4">
            <Timer className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">No test drive data</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
            Trends will appear once customers start booking test drives.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <CardTitle>Test Drive Trends</CardTitle>
            <CardDescription>
              Booking volume by status over time
            </CardDescription>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[140px] rounded-lg"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="14d" className="rounded-lg">
                Last 14 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillConfirmed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-confirmed)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-confirmed)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-pending)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-pending)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillCancelled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-cancelled)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-cancelled)" stopOpacity={0.1} />
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
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                tickFormatter={(value) => value}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              {/* Render stack order: bottom to top visually */}
              <Area
                dataKey="completed"
                type="monotone"
                fill="url(#fillCompleted)"
                stroke="var(--color-completed)"
                stackId="a"
              />
              <Area
                dataKey="confirmed"
                type="monotone"
                fill="url(#fillConfirmed)"
                stroke="var(--color-confirmed)"
                stackId="a"
              />
              <Area
                dataKey="pending"
                type="monotone"
                fill="url(#fillPending)"
                stroke="var(--color-pending)"
                stackId="a"
              />
              <Area
                dataKey="cancelled"
                type="monotone"
                fill="url(#fillCancelled)"
                stroke="var(--color-cancelled)"
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

export default TestDriveTrends;
