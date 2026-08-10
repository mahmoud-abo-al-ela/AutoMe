import type { UserRole } from "@/lib/generated/prisma";
import * as userRepo from "@/lib/repositories/super-admin/user";

/**
 * User service for Super Admin operations
 */

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  adminId: string
) {
  // Validate role
  if (!["USER", "ADMIN"].includes(newRole)) {
    throw new Error("Invalid role");
  }

  // Prevent removing your own admin role
  if (userId === adminId && newRole !== "ADMIN") {
    throw new Error("Cannot remove your own Admin role");
  }

  return userRepo.updateUserRole(userId, newRole);
}

export async function getUserById(userId: string) {
  return userRepo.findUserById(userId);
}

export async function getUserByEmail(email: string) {
  return userRepo.findUserByEmail(email);
}
