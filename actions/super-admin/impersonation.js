"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/services/super-admin/auth";
import * as impersonationService from "@/lib/services/super-admin/impersonation";

/**
 * Start an impersonation session
 */
export async function startImpersonation(organizationId, targetUserId) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

    const { session, targetUser } =
      await impersonationService.startImpersonation(
        organizationId,
        targetUserId,
        admin.id
      );

    await db.auditLog.create({
      data: {
        action: "IMPERSONATION_STARTED",
        entityType: "IMPERSONATION_SESSION",
        entityId: session.id,
        userId: admin.id,
        userEmail: admin.email,
        organizationId,
        metadata: {
          targetUserId,
          targetUserEmail: targetUser.email,
        },
      },
    });

    revalidatePath("/super-admin/impersonation");
    return {
      success: true,
      session,
      orgSlug: session.organization.slug,
    };
  } catch (error) {
    console.error("Error starting impersonation:", error);
    return { success: false, error: error.message };
  }
}

/**
 * End an impersonation session
 */
export async function endImpersonation(sessionId) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

    const session = await impersonationService.endImpersonation(sessionId);

    await db.auditLog.create({
      data: {
        action: "IMPERSONATION_ENDED",
        entityType: "IMPERSONATION_SESSION",
        entityId: sessionId,
        userId: admin.id,
        userEmail: admin.email,
        organizationId: session.targetOrganizationId,
        metadata: { action: "ended" },
      },
    });

    revalidatePath("/super-admin/impersonation");
    return { success: true };
  } catch (error) {
    console.error("Error ending impersonation:", error);
    return { success: false, error: error.message };
  }
}
