"use server";

import { revalidateLocalized } from "@/lib/utils/revalidate";
import { endImpersonation as endSession } from "@/lib/services/impersonation";
import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";

/**
 * End a support session from the super-admin sessions list — anyone's, not
 * only the caller's. Sessions start from the dealership page (actions/impersonation.ts);
 * both go through lib/services/impersonation, which records the end in the audit log.
 */
export const endImpersonation = withSuperAdmin(async (admin, sessionId: string) => {
  await endSession(sessionId, admin.email);

  revalidateLocalized("/super-admin/impersonation");
  return createSuccessResponse(null, "Support session ended");
});
