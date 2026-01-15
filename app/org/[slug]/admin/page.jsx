import React from "react";
import StatsCards from "./_components/StatsCards";
import { getDashboardStats, getOverviewChartData } from "@/actions/dashboard";
import OverviewChart from "./_components/OverviewChart";

export const metadata = {
  title: "Dashboard | AutoMe Admin",
  description: "Dashboard for AutoMe",
};

const DashboardPage = async () => {
  const { data } = await getDashboardStats();
  const chartData = await getOverviewChartData();
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Welcome back, here's what's happening with your platform
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <StatsCards data={data} />
        <OverviewChart data={chartData} />
      </div>
    </div>
  );
};

export default DashboardPage;
