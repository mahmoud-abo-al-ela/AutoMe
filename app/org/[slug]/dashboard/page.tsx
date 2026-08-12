import React from "react";
import type { ActionResponse } from "@/lib/utils/response";
import type { DashboardStats } from "../_components/StatsCards";
import type { OverviewPoint } from "../_components/OverviewChart";
import type { RevenueMetrics, ConversionFunnelData } from "../_components/AnalyticsCards";
import type { InventoryBreakdownData } from "../_components/InventoryBreakdown";
import type { PopularCar } from "../_components/PopularCars";
import type { TestDriveTrendPoint } from "../_components/TestDriveTrends";
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

/**
 * Pull `.data` out of a settled action result.
 *
 * Now checks `success` as well as `fulfilled`. Previously it only tested that
 * the promise resolved, so an action returning an error envelope yielded
 * `undefined` and skipped the fallback declared at the call site — the list
 * components then received undefined instead of []. Checking the discriminant
 * is what makes those fallbacks actually apply.
 */
function extract<T>(
  result: PromiseSettledResult<ActionResponse<T>>,
  fallback: T | null = null
): T | null {
  return result.status === "fulfilled" && result.value?.success
    ? result.value.data
    : fallback;
}

const DashboardPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
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

  // Explicit type arguments. These shapes originate in
  // lib/repositories/dashboard, which is deliberately still JavaScript, so what
  // infers through it varies: getPopularCarsData carries a real shape, while
  // the stats and analytics calls arrive as {} / unknown. Naming the type at
  // every call site keeps that inconsistency from being load-bearing — and the
  // ones that do infer still cross-check these declarations, which is how the
  // PopularCar price type got corrected from string to number.
  const data = extract<DashboardStats>(results[0]);
  const chartData = extract<OverviewPoint[]>(results[1], []) ?? [];
  const analyticsData = extract<{
    inventory: InventoryBreakdownData;
    revenue: RevenueMetrics;
  }>(results[2]);
  const funnelData = extract<ConversionFunnelData>(results[3]);
  const popularCarsData = extract<PopularCar[]>(results[4], []) ?? [];
  const trendsData = extract<TestDriveTrendPoint[]>(results[5], []) ?? [];

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
                Welcome back, here&apos;s what&apos;s happening with your platform
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
