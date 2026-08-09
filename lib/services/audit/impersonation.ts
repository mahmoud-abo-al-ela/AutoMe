import { createAuditLog } from "./audit";

/**
 * Impersonation audit log helpers
 */

interface AuditSession {
  id: string;
  targetOrganizationId?: string | null;
  superAdminId?: string | null;
  targetUserId?: string;
  reason?: string | null;
  // Nullable to match the Prisma row these are called with.
  endedAt?: Date | null;
  startedAt?: Date | null;
}

export async function logImpersonationStarted(session: AuditSession, superAdminEmail?: string | null) {
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

export async function logImpersonationEnded(session: AuditSession, superAdminEmail?: string | null) {
  return createAuditLog({
    action: "IMPERSONATION_ENDED",
    entityType: "IMPERSONATION_SESSION",
    entityId: session.id,
    organizationId: session.targetOrganizationId,
    userId: session.superAdminId,
    userEmail: superAdminEmail,
    newValue: {
      duration: Number(session.endedAt) - Number(session.startedAt),
    },
  });
}
