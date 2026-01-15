import {
  Building2,
  Users,
  Car,
  Calendar,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformStats({
  totalOrganizations,
  activeOrganizations,
  totalUsers,
  totalCars,
  totalTestDrives,
  subscriptionBreakdown,
}) {
  const stats = [
    {
      title: "Total Organizations",
      value: totalOrganizations,
      subtitle: `${activeOrganizations} active`,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Total Cars Listed",
      value: totalCars,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Total Test Drives",
      value: totalTestDrives,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Active Subscriptions by Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {subscriptionBreakdown.length > 0 ? (
              subscriptionBreakdown.map((item) => (
                <div
                  key={item.plan}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg"
                >
                  <span className="font-medium">{item.plan}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} {item.count === 1 ? "org" : "orgs"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No active subscriptions</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
