"use server";

import { checkUser, getActualUser } from "@/lib/checkUser";
import {
  startImpersonation,
  endImpersonation,
  getCurrentImpersonationSession,
} from "@/lib/services/impersonation";
import { revalidatePath } from "next/cache";

/**
 * Start an impersonation session (Super Admin only)
 */
export async function startImpersonationAction({
  targetUserId,
  targetOrganizationId,
  reason,
}) {
  try {
    // Get the actual user (not impersonated)
    const user = await getActualUser();

    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    if (!reason || reason.trim().length < 10) {
      return { success: false, error: "Reason must be at least 10 characters" };
    }

    const result = await startImpersonation({
      superAdminId: user.id,
      superAdminEmail: user.email,
      targetUserId,
      targetOrganizationId,
      reason,
    });

    return {
      success: true,
      data: {
        sessionId: result.session.id,
        organizationSlug: result.organization.slug,
      },
    };
  } catch (error) {
    console.error("Start impersonation error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * End the current impersonation session
 */
export async function endImpersonationAction() {
  try {
    const session = await getCurrentImpersonationSession();

    if (!session) {
      return { success: false, error: "No active impersonation session" };
    }

    // Get the actual super admin
    const user = await getActualUser();

    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await endImpersonation(session.id, user.email);

    revalidatePath("/super-admin");

    return { success: true };
  } catch (error) {
    console.error("End impersonation error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current impersonation status
 */
export async function getImpersonationStatus() {
  try {
    const session = await getCurrentImpersonationSession();

    if (!session) {
      return { isImpersonating: false };
    }

    return {
      isImpersonating: true,
      session: {
        id: session.id,
        superAdmin: session.superAdmin,
        targetUser: session.targetUser,
        targetOrganizationId: session.targetOrganizationId,
        startedAt: session.startedAt,
      },
    };
  } catch (error) {
    console.error("Get impersonation status error:", error);
    return { isImpersonating: false };
  }
}
