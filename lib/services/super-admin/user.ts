import type { UserRole } from "@/lib/generated/prisma";
import * as userRepo from "@/lib/repositories/super-admin/user";
import { ValidationError } from "@/lib/utils/errors";

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
    throw new ValidationError("Invalid role", "role");
  }

  // Prevent removing your own admin role
  if (userId === adminId && newRole !== "ADMIN") {
    throw new ValidationError("Cannot remove your own Admin role", "role");
  }

  return userRepo.updateUserRole(userId, newRole);
}

export async function getUserById(userId: string) {
  return userRepo.findUserById(userId);
}

export async function getUserByEmail(email: string) {
  return userRepo.findUserByEmail(email);
}
