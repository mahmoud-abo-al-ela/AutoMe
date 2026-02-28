"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as impersonationService from "@/lib/services/super-admin/impersonation";
import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";

/**
 * Start an impersonation session
 */
export const startImpersonation = withSuperAdmin(
  async (admin, organizationId, targetUserId) => {
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
    return createSuccessResponse({
      session,
      orgSlug: session.organization.slug,
    });
  }
);

/**
 * End an impersonation session
 */
export const endImpersonation = withSuperAdmin(async (admin, sessionId) => {
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
  return createSuccessResponse(null, "Impersonation session ended");
});
