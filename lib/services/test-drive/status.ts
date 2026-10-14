// Test drive status and listing service functions
import * as testDriveRepository from "@/lib/repositories/test-drive";
import * as userRepository from "@/lib/repositories/user";
import { auditHelpers } from "@/lib/services/audit/audit";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
  ConflictError,
} from "@/lib/utils/errors";
import { isImpersonatingOrganization } from "@/lib/services/impersonation/active";

/**
 * The dealer's moves: confirm or decline a request; mark a confirmed one done
 * or a no-show (CANCELLED). CANCELLED and COMPLETED are final.
 */
const TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
};

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

    const hasOrgAccess = user.memberships?.some(
      (m) => m.organizationId === organizationId && m.role === "OWNER",
    );

    // Without the dealership's access (its owner, or an admin in a verified
    // support session for it) a caller sees only their own test drives.
    if (!hasOrgAccess && !(await isImpersonatingOrganization(organizationId))) {
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

  // Only the customer who booked it, staff of the test drive's own dealership,
  // or an admin in a verified support session for that dealership may view it
  // — the record includes customer PII. Throw NotFound (not Forbidden) so ids
  // can't be enumerated.
  const isOwnerOfRecord = testDrive.userId === user.id;
  const hasOrgAccess = user.memberships?.some(
    (m) => m.organizationId === testDrive.organizationId,
  );
  if (!isOwnerOfRecord && !hasOrgAccess && !(await isImpersonatingOrganization(testDrive.organizationId))) {
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

  const hasOrgAccess = user.memberships?.some(
    (m) => m.organizationId === organizationId && m.role === "OWNER",
  );

  if (!hasOrgAccess && !(organizationId && (await isImpersonatingOrganization(organizationId)))) {
    throw new AuthorizationError("Only admins can update test drive status");
  }

  const testDrive = await testDriveRepository.findTestDriveById(testDriveId);
  if (!testDrive) {
    throw new NotFoundError("Test drive");
  }

  // Verify test drive belongs to the organization
  if (testDrive.organizationId !== organizationId) {
    throw new AuthorizationError("You don't have access to this test drive");
  }

  // Where a booking may go from where it is (owner's decision, 2026-10-13).
  // Nothing leads back to PENDING or CONFIRMED from CANCELLED or COMPLETED:
  // a cancelled booking freed its slot, and reviving it would put it back on
  // a day someone else may have taken since — without the slot check.
  const next = status.toUpperCase();
  if (!(TRANSITIONS[testDrive.status] ?? []).includes(next)) {
    throw new ValidationError(
      `A ${testDrive.status.toLowerCase()} test drive cannot become ${next.toLowerCase()}`,
      "status",
      { key: "errors.testDrive.invalidTransition" }
    );
  }

  // From the status just validated, or not at all: a booking the buyer
  // cancelled while the dealer was confirming stays cancelled.
  const updated = await testDriveRepository.transitionTestDrive(
    testDriveId,
    testDrive.organizationId,
    [testDrive.status],
    { status: next }
  );
  if (!updated) {
    throw new ConflictError("The test drive changed meanwhile", { key: "errors.testDrive.changed" });
  }
  await auditHelpers.logTestDriveStatusChanged(
    {
      id: testDrive.id,
      organizationId: testDrive.organizationId,
      carId: testDrive.carId,
      date: testDrive.date,
      startTime: testDrive.startTime,
      status: status.toUpperCase(),
    },
    testDrive.status,
    { id: user.id, email: user.email },
  );
  return updated;
}
