import * as impersonationRepo from "@/lib/repositories/super-admin/impersonation";
import * as membershipRepo from "@/lib/repositories/super-admin/membership";

/**
 * Impersonation service for Super Admin operations
 */

export async function startImpersonation(
  organizationId,
  targetUserId,
  adminId
) {
  // Verify target user exists and belongs to org
  const targetUser = await membershipRepo.findUserMembershipInOrganization(
    targetUserId,
    organizationId
  );

  if (!targetUser || targetUser.memberships.length === 0) {
    throw new Error("User not found in this organization");
  }

  // Create impersonation session
  const session = await impersonationRepo.createImpersonationSession({
    superAdminId: adminId,
    targetUserId,
    targetOrganizationId: organizationId,
    reason: "Super Admin impersonation",
  });

  return { session, targetUser };
}

export async function endImpersonation(sessionId) {
  return impersonationRepo.endImpersonationSession(sessionId);
}
