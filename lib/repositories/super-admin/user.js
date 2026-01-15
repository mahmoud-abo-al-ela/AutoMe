import { db } from "@/lib/prisma";

/**
 * User repository for Super Admin operations
 */

export async function findUserById(userId) {
  return db.user.findUnique({
    where: { id: userId },
  });
}

export async function findUserByClerkId(clerkId) {
  return db.user.findUnique({
    where: { clerkId },
  });
}

export async function findUserByEmail(email) {
  return db.user.findUnique({
    where: { email },
  });
}

export async function updateUserRole(userId, role) {
  return db.user.update({
    where: { id: userId },
    data: { role },
  });
}
