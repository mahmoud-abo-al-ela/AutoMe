"use server";
import { auth } from "@clerk/nextjs/server";
import * as dashboardService from "@/lib/services/dashboard";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/response";
import { AuthenticationError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { checkUser } from "@/lib/checkUser";

export async function getDashboardStats() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const user = await checkUser();
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Try to get organization from subdomain first
    let organization = await getCurrentOrganization();

    // If no organization from subdomain, get from user's first membership
    if (!organization && user.memberships?.length > 0) {
      organization = user.memberships[0].organization;
    }

    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    const stats = await dashboardService.getDashboardStats(userId, organization.id);

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

    const user = await checkUser();
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    let organization = await getCurrentOrganization();

    // If no organization from subdomain, get from user's first membership
    if (!organization && user.memberships?.length > 0) {
      organization = user.memberships[0].organization;
    }

    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    const chartData = await dashboardService.getOverviewChartData(userId, organization.id);

    // Return just the array directly without nesting it in a data property
    return chartData;
  } catch (error) {
    console.error("Error fetching overview chart data:", error);
    return [];
  }
}
