import { db } from "@/lib/prisma";
import { auditHelpers } from "@/lib/services/audit";
import { validateSuperAdmin, validateTargetMembership } from "./validation";
import {
  setImpersonationCookies,
  clearImpersonationCookies,
  getSessionIdFromCookies,
} from "./cookie";
import { getRequestMetadata } from "./metadata";
import { getImpersonationSessions, getActiveImpersonationCount } from "./query";

/**
 * Impersonation service for Super Admins to view organizations as specific users
 */

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
  const session = await db.impersonationSession.create({
    data: {
      superAdminId,
      targetUserId,
      targetOrganizationId,
      reason,
      ipAddress,
      userAgent,
    },
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
export async function endImpersonation(sessionId, superAdminEmail) {
  // Update session with end time
  const session = await db.impersonationSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });

  // Log the impersonation end
  await auditHelpers.logImpersonationEnded(session, superAdminEmail);

  // Clear cookies
  await clearImpersonationCookies();

  return session;
}

/**
 * Get current impersonation session from cookies
 */
export async function getCurrentImpersonationSession() {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) return null;

  const session = await db.impersonationSession.findUnique({
    where: { id: sessionId },
    include: {
      superAdmin: {
        select: { id: true, name: true, email: true },
      },
      targetUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Check if session is still valid (not ended and within 4 hours)
  if (session) {
    if (session.endedAt) {
      // Session was ended, clear cookies
      await clearImpersonationCookies();
      return null;
    }

    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    if (session.startedAt < fourHoursAgo) {
      // Session expired, end it
      await endImpersonation(sessionId, session.superAdmin.email);
      return null;
    }
  }

  return session;
}

export { getImpersonationSessions, getActiveImpersonationCount };

export default {
  startImpersonation,
  endImpersonation,
  getCurrentImpersonationSession,
  getImpersonationSessions,
  getActiveImpersonationCount,
};
