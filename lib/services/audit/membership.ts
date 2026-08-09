import { createAuditLog } from "./audit";

/**
 * Membership audit log helpers
 */

interface AuditMembership {
  id: string;
  organizationId: string;
  userId?: string;
  role?: string;
}

export async function logMemberInvited(membership: AuditMembership, inviterId?: string | null, inviterEmail?: string | null) {
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
  membership: AuditMembership,
  oldRole: string,
  userId?: string | null,
  userEmail?: string | null
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

export async function logMemberRemoved(membership: AuditMembership, userId?: string | null, userEmail?: string | null) {
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
