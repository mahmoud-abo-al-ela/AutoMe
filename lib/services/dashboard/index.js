// Dashboard service - Business logic layer
import * as dashboardRepository from "@/lib/repositories/dashboard";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

/**
 * Get dashboard statistics for an organization
 */
export async function getDashboardStats(userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has access to this organization
  const hasAccess = user.memberships?.some(m => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  return await dashboardRepository.getDashboardCounts(organizationId);
}

/**
 * Get overview chart data for an organization
 */
export async function getOverviewChartData(userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has access to this organization
  const hasAccess = user.memberships?.some(m => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  const { users, cars, testDrives } =
    await dashboardRepository.getOverviewData(organizationId);

  return dashboardRepository.aggregateByDate(users, cars, testDrives);
}
