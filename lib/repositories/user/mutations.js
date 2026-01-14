// User mutation functions
import { db } from "@/lib/prisma";
import { serializeUser } from "@/lib/utils/serializers";

/**
 * Create a new user
 */
export async function createUser(userData) {
  const user = await db.user.create({
    data: userData,
  });

  return serializeUser(user);
}

/**
 * Update a user
 */
export async function updateUser(id, userData) {
  const user = await db.user.update({
    where: { id },
    data: userData,
  });

  return serializeUser(user);
}
