"use server";
import { auth } from "@clerk/nextjs/server";
import * as dashboardService from "@/lib/services/dashboard";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/response";
import { AuthenticationError } from "@/lib/utils/errors";

export async function getDashboardStats() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const stats = await dashboardService.getDashboardStats(userId);

    return createSuccessResponse(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return createErrorResponse(error);
  }
}

export async function getOverviewChartData() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const chartData = await dashboardService.getOverviewChartData(userId);

    // Return just the array directly without nesting it in a data property
    return chartData;
  } catch (error) {
    console.error("Error fetching overview chart data:", error);
    return [];
  }
}
