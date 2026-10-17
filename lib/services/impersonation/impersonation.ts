import * as impersonationRepo from "@/lib/repositories/impersonation";
import { auditHelpers } from "@/lib/services/audit";
import { validateSuperAdmin, validateTargetMembership } from "./validation";
import {
  setImpersonationCookies,
  clearImpersonationCookies,
  getSessionIdFromCookies,
} from "./cookie";
import { getRequestMetadata } from "./metadata";
import { lifetimeStart } from "./active";
import { reportSignal } from "@/lib/observability/report";

/**
 * Impersonation service for Super Admins to view organizations as specific users
 */

export const getImpersonationSessions = impersonationRepo.getImpersonationSessions;

/** Support sessions running now: not ended, and started within their lifetime. */
export async function getActiveImpersonationCount() {
  return impersonationRepo.countOpenSessionsStartedSince(lifetimeStart());
}

export async function startImpersonation({
  superAdminId,
  superAdminEmail,
  targetUserId,
  targetOrganizationId,
  reason,
}: {
  superAdminId: string;
  superAdminEmail?: string | null;
  targetUserId: string;
  targetOrganizationId: string;
  reason: string;
}) {
  // Validate Super Admin
  await validateSuperAdmin(superAdminId);

  // Validate target user exists and has access to the organization
  const targetMembership = await validateTargetMembership(
    targetUserId,
    targetOrganizationId
  );

  // Get request metadata
  const { ipAddress, userAgent } = await getRequestMetadata();

  // Create impersonation session
  const session = await impersonationRepo.createImpersonationSession({
    superAdminId,
    targetUserId,
    targetOrganizationId,
    reason,
    ipAddress,
    userAgent,
  });

  // Log the impersonation start
  await auditHelpers.logImpersonationStarted(session, superAdminEmail);
  // Every session is worth a glance: an admin acting as a dealer. Ids only;
  // the reason is in the audit log.
  void reportSignal({
    name: "support-session.started",
    level: "info",
    tags: { "session.id": session.id, "organization.id": targetOrganizationId, "admin.id": superAdminId },
  });

  // Set cookies for impersonation context
  await setImpersonationCookies(
    session.id,
    targetUserId,
    targetMembership.organization.slug
  );

  return {
    session,
    organization: targetMembership.organization,
    targetUser: targetMembership.user,
  };
}

export async function endImpersonation(
  sessionId: string,
  superAdminEmail?: string | null
) {
  // Update session with end time
  const session = await impersonationRepo.endImpersonationSession(sessionId, new Date());

  // Log the impersonation end
  await auditHelpers.logImpersonationEnded(session, superAdminEmail);
  void reportSignal({
    name: "support-session.ended",
    level: "info",
    tags: { "session.id": session.id, "organization.id": session.targetOrganizationId },
  });

  // Only the caller's own session lives in their cookies. Ending someone
  // else's from the super-admin sessions list must not sign this admin out
  // of the session they are in.
  if ((await getSessionIdFromCookies()) === sessionId) {
    await clearImpersonationCookies();
  }

  return session;
}

/**
 * Get current impersonation session from cookies
 */
export async function getCurrentImpersonationSession() {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) return null;

  const session = await impersonationRepo.findSessionWithParticipants(sessionId);

  // Check if session is still valid (not ended and within 4 hours)
  if (session) {
    if (session.endedAt) {
      // Session was ended, clear cookies
      await clearImpersonationCookies();
      return null;
    }

    if (session.startedAt < lifetimeStart()) {
      // Session expired, end it
      await endImpersonation(sessionId, session.superAdmin.email);
      return null;
    }
  }

  return session;
}

export default {
  startImpersonation,
  endImpersonation,
  getCurrentImpersonationSession,
  getImpersonationSessions,
  getActiveImpersonationCount,
};
