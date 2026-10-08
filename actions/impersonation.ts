"use server";

import { getActualUser } from "@/lib/checkUser";
import {
  startImpersonation,
  endImpersonation,
  getCurrentImpersonationSession,
} from "@/lib/services/impersonation";
import { revalidateLocalized } from "@/lib/utils/revalidate";
import { withErrorHandling } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
} from "@/lib/utils/errors";

/**
 * Start an impersonation session (Super Admin only)
 */
export const startImpersonationAction = withErrorHandling(
  async ({ targetUserId, targetOrganizationId, reason }) => {
    // Get the actual user (not impersonated)
    const user = await getActualUser();

    if (!user || user.role !== "ADMIN") {
      throw new AuthorizationError();
    }

    if (!reason || reason.trim().length < 10) {
      throw new ValidationError(
        "Reason must be at least 10 characters",
        "reason",
        { key: "errors.superAdmin.reasonTooShort", params: { min: 10 } }
      );
    }

    const result = await startImpersonation({
      superAdminId: user.id,
      superAdminEmail: user.email,
      targetUserId,
      targetOrganizationId,
      reason,
    });

    return createSuccessResponse({
      sessionId: result.session.id,
      organizationSlug: result.organization.slug,
    });
  }
);

/**
 * End the current impersonation session
 */
export const endImpersonationAction = withErrorHandling(async () => {
  const session = await getCurrentImpersonationSession();

  if (!session) {
    throw new NotFoundError("Support session");
  }

  // Get the actual super admin
  const user = await getActualUser();

  if (!user || user.role !== "ADMIN") {
    throw new AuthorizationError();
  }

  await endImpersonation(session.id, user.email);

  revalidateLocalized("/super-admin");

  return createSuccessResponse(null, "Support session ended");
});

/**
 * Get current impersonation status
 */
export const getImpersonationStatus = withErrorHandling(async () => {
  const session = await getCurrentImpersonationSession();

  if (!session) {
    return createSuccessResponse({ isImpersonating: false });
  }

  return createSuccessResponse({
    isImpersonating: true,
    session: {
      id: session.id,
      superAdmin: session.superAdmin,
      targetUser: session.targetUser,
      targetOrganizationId: session.targetOrganizationId,
      startedAt: session.startedAt,
    },
  });
});
