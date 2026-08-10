"use server";

import { revalidatePath } from "next/cache";
import * as impersonationService from "@/lib/services/super-admin/impersonation";
import { auditHelpers } from "@/lib/services/audit/audit";
import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { startImpersonationSchema } from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";

/**
 * Start an impersonation session
 */
export const startImpersonation = withSuperAdmin(
  async (admin, organizationId: string, targetUserId: string) => {
    await enforceRateLimit();
    const validated = validateAction(startImpersonationSchema, {
      organizationId,
      targetUserId,
    });
    organizationId = validated.organizationId;
    targetUserId = validated.targetUserId;

    const { session } = await impersonationService.startImpersonation(
      organizationId,
      targetUserId,
      admin.id
    );

    // Audit through the service layer (captures request metadata + retention);
    // no direct db access from the action layer.
    await auditHelpers.logImpersonationStarted(session, admin.email);

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
export const endImpersonation = withSuperAdmin(async (admin, sessionId: string) => {
  const session = await impersonationService.endImpersonation(sessionId);

  await auditHelpers.logImpersonationEnded(session, admin.email);

  revalidatePath("/super-admin/impersonation");
  return createSuccessResponse(null, "Impersonation session ended");
});
