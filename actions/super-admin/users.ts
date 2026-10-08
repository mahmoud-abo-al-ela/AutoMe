"use server";

import { db } from "@/lib/prisma";
import { revalidateLocalized } from "@/lib/utils/revalidate";
import * as userService from "@/lib/services/super-admin/user";
import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import type { UserRole } from "@/lib/generated/prisma";
import * as usersService from "@/lib/services/super-admin/users";
import { parseUserQuery } from "@/lib/services/super-admin/users-options";

/**
 * Update a user's role
 */
export const updateUserRole = withSuperAdmin(
  async (admin, userId: string, newRole: UserRole) => {
    await userService.updateUserRole(userId, newRole, admin.id);

    await db.auditLog.create({
      data: {
        action: "USER_ROLE_CHANGED",
        entityType: "USER",
        entityId: userId,
        userId: admin.id,
        userEmail: admin.email,
        metadata: { newRole },
      },
    });

    revalidateLocalized("/super-admin/users");
    return createSuccessResponse(null, "User role updated");
  }
);

/**
 * Everyone the users list's current view and filters match, for its CSV.
 * Takes the list's URL params through the page's own parser.
 */
export const exportUsers = withSuperAdmin(async (_admin, params: Record<string, string>) => {
  const rows = await usersService.getUsersForExport(parseUserQuery(typeof params === "object" && params ? params : {}));
  return createSuccessResponse(rows);
});
