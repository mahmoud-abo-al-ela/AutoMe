"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as userService from "@/lib/services/super-admin/user";
import { withSuperAdmin } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import type { UserRole } from "@/lib/generated/prisma";

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

    revalidatePath("/super-admin/users");
    return createSuccessResponse(null, "User role updated");
  }
);
