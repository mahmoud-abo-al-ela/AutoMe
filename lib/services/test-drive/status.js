// Test drive status and listing service functions
import * as testDriveRepository from "@/lib/repositories/test-drive";
import * as userRepository from "@/lib/repositories/user";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "@/lib/utils/errors";

/**
 * Get test drives with filters
 */
export async function getTestDrives(filters, pagination, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const queryFilters = { ...filters };
  if (user.role !== "ADMIN") {
    queryFilters.userId = user.id;
  }

  return await testDriveRepository.findManyTestDrives(queryFilters, pagination);
}

/**
 * Get test drive by ID
 */
export async function getTestDriveById(testDriveId, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const testDrive = await testDriveRepository.findTestDriveById(testDriveId);
  if (!testDrive) {
    throw new NotFoundError("Test drive");
  }

  return testDrive;
}

/**
 * Update test drive status (admin only)
 */
export async function updateTestDriveStatus(testDriveId, status, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  if (user.role !== "ADMIN") {
    throw new AuthorizationError("Only admins can update test drive status");
  }

  const testDrive = await testDriveRepository.findTestDriveById(testDriveId);
  if (!testDrive) {
    throw new NotFoundError("Test drive");
  }

  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ];
  if (!validStatuses.includes(status.toUpperCase())) {
    throw new ValidationError(`Invalid status: ${status}`, "status");
  }

  return await testDriveRepository.updateTestDrive(testDriveId, {
    status: status.toUpperCase(),
  });
}
