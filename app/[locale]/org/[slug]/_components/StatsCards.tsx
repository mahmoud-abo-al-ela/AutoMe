import React from "react";
import { Users, CarFront, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Headline counts from getDashboardStats(). */
export type DashboardStats = {
  users: number;
  cars: number;
  testDrives: number;
};

const StatsCards = ({ data }: { data: DashboardStats | null }) => {
  const stats = [
    {
      title: "Total Users",
      value: data?.users || 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Cars Listed",
      value: data?.cars || 0,
      icon: CarFront,
      color: "bg-green-500",
    },
    {
      title: "Test Drives",
      value: data?.testDrives || 0,
      icon: Timer,
      color: "bg-purple-500",
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={stat.title} className="p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
