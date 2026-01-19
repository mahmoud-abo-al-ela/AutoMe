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
 * Get test drives with filters (organization-scoped)
 */
export async function getTestDrives(filters, pagination, userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const isAdmin = user.role === "ADMIN";
  const hasOrgAccess = organizationId && user.memberships?.some(m => m.organizationId === organizationId && m.role === "OWNER");

  const queryFilters = { ...filters };

  // Only add organizationId filter if provided
  if (organizationId) {
    queryFilters.organizationId = organizationId;
  }

  // Non-admins without org access only see their own test drives
  if (!isAdmin && !hasOrgAccess) {
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
export async function updateTestDriveStatus(testDriveId, status, userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const isAdmin = user.role === "ADMIN";
  const hasOrgAccess = user.memberships?.some(m => m.organizationId === organizationId && m.role === "OWNER");

  if (!isAdmin && !hasOrgAccess) {
    throw new AuthorizationError("Only admins can update test drive status");
  }

  const testDrive = await testDriveRepository.findTestDriveById(testDriveId);
  if (!testDrive) {
    throw new NotFoundError("Test drive");
  }

  // Verify test drive belongs to the organization
  if (testDrive.organizationId !== organizationId && !isAdmin) {
    throw new AuthorizationError("You don't have access to this test drive");
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
