"use client";

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

const chartConfig = {
  organizations: {
    label: "Organizations",
    color: "hsl(var(--chart-1))",
  },
  users: {
    label: "Users",
    color: "hsl(var(--chart-2))",
  },
  cars: {
    label: "Cars",
    color: "hsl(var(--chart-3))",
  },
  testDrives: {
    label: "Test Drives",
    color: "hsl(var(--chart-4))",
  },
};

export default function AnalyticsCharts({ monthlyData }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Growth Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Growth</CardTitle>
          <CardDescription>
            New organizations and users over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
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
          <CardTitle>Platform Activity</CardTitle>
          <CardDescription>
            Car listings and test drive bookings over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
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
