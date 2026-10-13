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

/**
 * Update the user with this Clerk id, if there is one; returns how many rows
 * changed (0 or 1). `updateMany` rather than `update`, which throws when no
 * row matches.
 */
export async function updateUsersByClerkId(clerkId: string, data: Prisma.UserUpdateManyMutationInput) {
  const { count } = await db.user.updateMany({
    where: { clerkId },
    data,
  });
  return count;
}

/** Delete the user with this Clerk id; related rows go by cascade. */
export async function deleteUserByClerkId(clerkId: string) {
  await db.user.delete({
    where: { clerkId },
  });
}

/**
 * Move a user from one Clerk ID to another — for an account copied between
 * Clerk instances, whose new ID must take over the row (and with it every
 * membership, booking and saved car). True if a row moved. False if none had
 * the old ID, or the new ID already has a row (P2002): one person, one row.
 */
export async function relinkClerkId(previousClerkId: string, clerkId: string): Promise<boolean> {
  try {
    const { count } = await db.user.updateMany({ where: { clerkId: previousClerkId }, data: { clerkId } });
    return count === 1;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return false;
    throw error;
  }
}
