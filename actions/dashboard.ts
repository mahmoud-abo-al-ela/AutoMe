"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import * as dashboardService from "@/lib/services/dashboard";
import { createSuccessResponse } from "@/lib/utils/response";

export const getDashboardStats = withOrgAuth(async (ctx) => {
  const stats = await dashboardService.getDashboardStats(ctx.userId, ctx.organization.id);
  return createSuccessResponse(stats);
});

export const getOverviewChartData = withOrgAuth(async (ctx) => {
  const chartData = await dashboardService.getOverviewChartData(ctx.userId, ctx.organization.id);
  return createSuccessResponse(chartData);
});

export const getAnalytics = withOrgAuth(async (ctx) => {
  const analytics = await dashboardService.getAnalytics(ctx.userId, ctx.organization.id);
  return createSuccessResponse(analytics);
});

export const getConversionFunnel = withOrgAuth(async (ctx) => {
  const funnel = await dashboardService.getConversionFunnel(ctx.userId, ctx.organization.id);
  return createSuccessResponse(funnel);
});

export const getPopularCarsData = withOrgAuth(async (ctx) => {
  const cars = await dashboardService.getPopularCarsData(ctx.userId, ctx.organization.id);
  return createSuccessResponse(cars);
});

export const getTestDriveTrendsData = withOrgAuth(async (ctx) => {
  const days = 30; // default to 30 days, could be passed in payload
  const trends = await dashboardService.getTestDriveTrendsData(ctx.userId, ctx.organization.id, days);
  return createSuccessResponse(trends);
});
