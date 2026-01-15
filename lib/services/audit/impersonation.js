import { createAuditLog } from "./audit";

/**
 * Impersonation audit log helpers
 */

export async function logImpersonationStarted(session, superAdminEmail) {
  return createAuditLog({
    action: "IMPERSONATION_STARTED",
    entityType: "IMPERSONATION_SESSION",
    entityId: session.id,
    organizationId: session.targetOrganizationId,
    userId: session.superAdminId,
    userEmail: superAdminEmail,
    newValue: {
      targetUserId: session.targetUserId,
      targetOrganizationId: session.targetOrganizationId,
      reason: session.reason,
    },
  });
}

export async function logImpersonationEnded(session, superAdminEmail) {
  return createAuditLog({
    action: "IMPERSONATION_ENDED",
    entityType: "IMPERSONATION_SESSION",
    entityId: session.id,
    organizationId: session.targetOrganizationId,
    userId: session.superAdminId,
    userEmail: superAdminEmail,
    newValue: {
      duration: session.endedAt - session.startedAt,
    },
  });
}
