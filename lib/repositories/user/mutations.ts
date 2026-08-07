// User mutation functions
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { serializeUser } from "@/lib/utils/serializers";

/**
 * Create a new user
 */
export async function createUser(userData: Prisma.UserUncheckedCreateInput) {
  const user = await db.user.create({
    data: userData,
  });

  return serializeUser(user);
}

/**
 * Update a user
 */
export async function updateUser(id: string, userData: Prisma.UserUncheckedUpdateInput) {
  const user = await db.user.update({
    where: { id },
    data: userData,
  });

  return serializeUser(user);
}
