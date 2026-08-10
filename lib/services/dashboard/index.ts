// Dashboard service - Business logic layer
import * as dashboardRepository from "@/lib/repositories/dashboard";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

/**
 * Get dashboard statistics for an organization
 */
export async function getDashboardStats(userId: string, organizationId: string) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has access to this organization
  const hasAccess = user.memberships?.some((m) => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  return await dashboardRepository.getDashboardCounts(organizationId);
}

/**
 * Get overview chart data for an organization
 */
export async function getOverviewChartData(userId: string, organizationId: string) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has access to this organization
  const hasAccess = user.memberships?.some((m) => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  const { users, cars, testDrives } =
    await dashboardRepository.getOverviewData(organizationId);

  return dashboardRepository.aggregateByDate(users, cars, testDrives);
}

/**
 * Helper to verify user access to an organization
 */
async function verifyAccess(userId: string, organizationId: string) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const hasAccess = user.memberships?.some((m) => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  return user;
}

/**
 * Get aggregated analytics data for dashboard
 */
export async function getAnalytics(userId: string, organizationId: string) {
  await verifyAccess(userId, organizationId);

  const [inventory, revenue] = await Promise.all([
    dashboardRepository.getInventoryBreakdown(organizationId),
    dashboardRepository.getRevenueMetrics(organizationId),
  ]);

  return { inventory, revenue };
}

/**
 * Get conversion funnel metrics
 */
export async function getConversionFunnel(userId: string, organizationId: string) {
  await verifyAccess(userId, organizationId);

  const metrics = await dashboardRepository.getConversionMetrics(organizationId);
  
  // Calculate funnel percentages
  const confirmedRate = metrics.total > 0 ? (metrics.confirmed / metrics.total) * 100 : 0;
  const completedRate = metrics.confirmed > 0 ? (metrics.completed / metrics.confirmed) * 100 : 0;

  return {
    ...metrics,
    confirmedRate,
    completedRate,
  };
}

/**
 * Get popular cars data
 */
export async function getPopularCarsData(userId: string, organizationId: string) {
  await verifyAccess(userId, organizationId);
  return await dashboardRepository.getPopularCars(organizationId, 5);
}

/**
 * Get test drive trends
 */
export async function getTestDriveTrendsData(
  userId: string,
  organizationId: string,
  days = 30
) {
  await verifyAccess(userId, organizationId);
  return await dashboardRepository.getTestDriveTrends(organizationId, days);
}
