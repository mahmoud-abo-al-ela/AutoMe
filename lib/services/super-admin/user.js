import * as userRepo from "@/lib/repositories/super-admin/user";

/**
 * User service for Super Admin operations
 */

export async function updateUserRole(userId, newRole, adminId) {
  // Validate role
  if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(newRole)) {
    throw new Error("Invalid role");
  }

  // Prevent removing your own super admin role
  if (userId === adminId && newRole !== "SUPER_ADMIN") {
    throw new Error("Cannot remove your own Super Admin role");
  }

  return userRepo.updateUserRole(userId, newRole);
}

export async function getUserById(userId) {
  return userRepo.findUserById(userId);
}

export async function getUserByEmail(email) {
  return userRepo.findUserByEmail(email);
}
