import { TrendingUp, TrendingDown, Building2, Users, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Month-over-month counts for one entity, as computed in page.tsx. */
export type GrowthMetric = {
  current: number;
  previous: number;
  /** Percentage change vs last month; 0 when last month was empty. */
  change: number;
};

export default function GrowthMetrics({
  growth,
}: {
  growth: { organizations: GrowthMetric; users: GrowthMetric; cars: GrowthMetric };
}) {
  const metrics = [
    {
      title: "Organizations",
      ...growth.organizations,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Users",
      ...growth.users,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Cars Listed",
      ...growth.cars,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => {
        const isPositive = metric.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title} (This Month)
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.current}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon
                  className={`h-4 w-4 ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {metric.change.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  vs last month ({metric.previous})
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
