"use server";

import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import * as activityService from "@/lib/services/super-admin/platform-activity";
import { parsePlatformActivityQuery } from "@/lib/services/super-admin/platform-activity-options";

/**
 * Every change the Activity page's filters match, up to the export limit,
 * for the CSV the page builds in the admin's language.
 */
export const exportActivity = withSuperAdmin(async (_admin, params: Record<string, string>) => {
  const data = await activityService.getPlatformActivityForExport(parsePlatformActivityQuery(typeof params === "object" && params ? params : {}));
  return createSuccessResponse(data);
});
