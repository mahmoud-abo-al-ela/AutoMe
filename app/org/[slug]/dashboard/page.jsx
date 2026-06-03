import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCards from "../_components/StatsCards";
import OverviewChart from "../_components/OverviewChart";
import AnalyticsCards from "../_components/AnalyticsCards";
import ConversionFunnel from "../_components/ConversionFunnel";
import PopularCars from "../_components/PopularCars";
import InventoryBreakdown from "../_components/InventoryBreakdown";
import TestDriveTrends from "../_components/TestDriveTrends";
import { DashboardPlanBanners } from "./_components/dashboard-plan-banners";
import { 
  getDashboardStats, 
  getOverviewChartData,
  getAnalytics,
  getConversionFunnel,
  getPopularCarsData,
  getTestDriveTrendsData
} from "@/actions/dashboard";
export const metadata = {
  title: "Dashboard | AutoMe Admin",
  description: "Dashboard for AutoMe",
};

const DashboardPage = async ({ params }) => {
  const { slug } = await params;
  // Fetch data in parallel
  const results = await Promise.allSettled([
    getDashboardStats(),
    getOverviewChartData(),
    getAnalytics(),
    getConversionFunnel(),
    getPopularCarsData(),
    getTestDriveTrendsData()
  ]);

  const extract = (result, fallback = null) =>
    result.status === "fulfilled" && result.value ? result.value.data : fallback;

  const data = extract(results[0]);
  const chartData = extract(results[1], []);
  const analyticsData = extract(results[2]);
  const funnelData = extract(results[3]);
  const popularCarsData = extract(results[4], []);
  const trendsData = extract(results[5], []);

  return (
    <div className="w-full">
      <DashboardPlanBanners orgSlug={slug} />
      <Tabs defaultValue="overview" className="w-full">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Welcome back, here's what's happening with your platform
              </p>
            </div>
            <TabsList>
              <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
              <TabsTrigger value="analytics" className="cursor-pointer">Analytics</TabsTrigger>
            </TabsList>
          </div>
        </div>
      
      <TabsContent value="overview" className="flex flex-col gap-4 mt-0">
        <StatsCards data={data} />
        <OverviewChart data={chartData} />
      </TabsContent>

      <TabsContent value="analytics" className="flex flex-col gap-4 mt-0">
        <AnalyticsCards revenue={analyticsData?.revenue} conversionFunnel={funnelData} />
        <ConversionFunnel funnel={funnelData} />
        <div className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-3">
            <PopularCars cars={popularCarsData} />
          </div>
          <div className="md:col-span-2">
            <InventoryBreakdown breakdown={analyticsData?.inventory} />
          </div>
        </div>
        <TestDriveTrends data={trendsData} />
      </TabsContent>
    </Tabs>
    </div>
  );
};

export default DashboardPage;
