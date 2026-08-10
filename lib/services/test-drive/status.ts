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
 * When organizationId is null (main domain), shows only the user's own test drives
 */
export async function getTestDrives(
  filters: Record<string, unknown>,
  pagination: { page?: number; limit?: number },
  userId: string,
  organizationId?: string | null,
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const queryFilters = { ...filters };

  if (organizationId) {
    // On a subdomain: scope to the organization
    queryFilters.organizationId = organizationId;

    const isAdmin = user.role === "ADMIN";
    const hasOrgAccess = user.memberships?.some(
      (m) => m.organizationId === organizationId && m.role === "OWNER",
    );

    // Non-admins without org access only see their own test drives
    if (!isAdmin && !hasOrgAccess) {
      queryFilters.userId = user.id;
    }
  } else {
    // On main domain (no org context): show only the user's own test drives
    queryFilters.userId = user.id;
  }

  return await testDriveRepository.findManyTestDrives(queryFilters, pagination);
}

/**
 * Get test drive by ID
 */
export async function getTestDriveById(testDriveId: string, userId: string) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const testDrive = await testDriveRepository.findTestDriveById(testDriveId);
  if (!testDrive) {
    throw new NotFoundError("Test drive");
  }

  // Only the customer who booked it, platform admins, or staff of the test
  // drive's own dealership may view it — the record includes customer PII.
  // Throw NotFound (not Forbidden) so ids can't be enumerated.
  const isAdmin = user.role === "ADMIN";
  const isOwnerOfRecord = testDrive.userId === user.id;
  const hasOrgAccess = user.memberships?.some(
    (m) => m.organizationId === testDrive.organizationId,
  );
  if (!isOwnerOfRecord && !isAdmin && !hasOrgAccess) {
    throw new NotFoundError("Test drive");
  }

  return testDrive;
}

/**
 * Update test drive status (admin only)
 */
export async function updateTestDriveStatus(
  testDriveId: string,
  status: string,
  userId: string,
  organizationId?: string | null,
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const isAdmin = user.role === "ADMIN";
  const hasOrgAccess = user.memberships?.some(
    (m) => m.organizationId === organizationId && m.role === "OWNER",
  );

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
