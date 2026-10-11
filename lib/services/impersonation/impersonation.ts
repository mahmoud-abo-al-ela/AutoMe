import * as impersonationRepo from "@/lib/repositories/impersonation";
import { auditHelpers } from "@/lib/services/audit";
import { validateSuperAdmin, validateTargetMembership } from "./validation";
import {
  setImpersonationCookies,
  clearImpersonationCookies,
  getSessionIdFromCookies,
} from "./cookie";
import { getRequestMetadata } from "./metadata";

/**
 * Impersonation service for Super Admins to view organizations as specific users
 */

/** A support session ends on its own this long after it starts. */
const SESSION_LIFETIME_MS = 4 * 60 * 60 * 1000;

const lifetimeStart = () => new Date(Date.now() - SESSION_LIFETIME_MS);

export const getImpersonationSessions = impersonationRepo.getImpersonationSessions;

/** Support sessions running now: not ended, and started within their lifetime. */
export async function getActiveImpersonationCount() {
  return impersonationRepo.countOpenSessionsStartedSince(lifetimeStart());
}

/**
 * Start an impersonation session
 * @param {Object} params
 * @param {string} params.superAdminId - The Super Admin's user ID
 * @param {string} params.superAdminEmail - The Super Admin's email
 * @param {string} params.targetUserId - The user ID to impersonate
 * @param {string} params.targetOrganizationId - The organization to access
 * @param {string} params.reason - Required reason for impersonation
 * @returns {Promise<Object>} The impersonation session
 */
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

/**
 * End an impersonation session
 * @param {string} sessionId - The impersonation session ID
 * @param {string} superAdminEmail - The Super Admin's email for logging
 */
export async function endImpersonation(
  sessionId: string,
  superAdminEmail?: string | null
) {
  // Update session with end time
  const session = await impersonationRepo.endImpersonationSession(sessionId, new Date());

  // Log the impersonation end
  await auditHelpers.logImpersonationEnded(session, superAdminEmail);

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
