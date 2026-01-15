"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/services/super-admin/auth";
import * as userService from "@/lib/services/super-admin/user";

/**
 * Update a user's role
 */
export async function updateUserRole(userId, newRole) {
  try {
    const { userId: clerkId } = await auth();
    const admin = await requireSuperAdmin(clerkId);

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
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: error.message };
  }
}
