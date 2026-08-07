import { db } from "@/lib/prisma";
import { UserRole } from "@/lib/generated/prisma";

/**
 * User repository for Super Admin operations
 */

export async function findUserById(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
  });
}

export async function findUserByClerkId(clerkId: string) {
  return db.user.findUnique({
    where: { clerkId },
  });
}

export async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  return db.user.update({
    where: { id: userId },
    data: { role },
  });
}
