"use server";

import { revalidateLocalized } from "@/lib/utils/revalidate";
import { endImpersonation as endSession } from "@/lib/services/impersonation";
import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";

export const endImpersonation = withSuperAdmin(async (admin, sessionId: string) => {
  await endSession(sessionId, admin.email);

  revalidateLocalized("/super-admin/impersonation");
  return createSuccessResponse(null, "Support session ended");
});
