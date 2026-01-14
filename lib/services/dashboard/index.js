// Dashboard service - Business logic layer
import * as dashboardRepository from "@/lib/repositories/dashboard";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError } from "@/lib/utils/errors";

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return await dashboardRepository.getDashboardCounts();
}

/**
 * Get overview chart data
 */
export async function getOverviewChartData(userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const { users, cars, testDrives } =
    await dashboardRepository.getOverviewData();

  return dashboardRepository.aggregateByDate(users, cars, testDrives);
}
