import * as userRepo from "@/lib/repositories/super-admin/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

/**
 * Authentication helper for Super Admin operations
 */

export async function requireSuperAdmin(clerkId) {
  if (!clerkId) {
    throw new AuthenticationError();
  }

  const user = await userRepo.findUserByClerkId(clerkId);

  if (!user || user.role !== "ADMIN") {
    throw new AuthorizationError("Admin access required");
  }

  return user;
}
