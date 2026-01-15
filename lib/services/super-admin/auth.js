import * as userRepo from "@/lib/repositories/super-admin/user";

/**
 * Authentication helper for Super Admin operations
 */

export async function requireSuperAdmin(clerkId) {
  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  const user = await userRepo.findUserByClerkId(clerkId);

  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Super Admin access required");
  }

  return user;
}
