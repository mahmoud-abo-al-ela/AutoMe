import { createAuditLog } from "./audit";

/**
 * Membership audit log helpers
 */

export async function logMemberInvited(membership, inviterId, inviterEmail) {
  return createAuditLog({
    action: "MEMBER_INVITED",
    entityType: "MEMBERSHIP",
    entityId: membership.id,
    organizationId: membership.organizationId,
    userId: inviterId,
    userEmail: inviterEmail,
    newValue: { userId: membership.userId, role: membership.role },
  });
}

export async function logMemberRoleChanged(
  membership,
  oldRole,
  userId,
  userEmail
) {
  return createAuditLog({
    action: "MEMBER_ROLE_CHANGED",
    entityType: "MEMBERSHIP",
    entityId: membership.id,
    organizationId: membership.organizationId,
    userId,
    userEmail,
    oldValue: { role: oldRole },
    newValue: { role: membership.role },
  });
}

export async function logMemberRemoved(membership, userId, userEmail) {
  return createAuditLog({
    action: "MEMBER_REMOVED",
    entityType: "MEMBERSHIP",
    entityId: membership.id,
    organizationId: membership.organizationId,
    userId,
    userEmail,
    oldValue: { userId: membership.userId, role: membership.role },
  });
}
