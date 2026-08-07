// User query functions
import { db } from "@/lib/prisma";
import { serializeUser } from "@/lib/utils/serializers";

/**
 * Find user by Clerk ID
 */
export async function findUserByClerkId(clerkId: string) {
  const user = await db.user.findUnique({
    where: { clerkId },
  });

  return serializeUser(user);
}

/**
 * Find user by Clerk ID with memberships (for role checking)
 */
export async function findUserByClerkIdWithMemberships(clerkId: string) {
  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...serializeUser(user),
    memberships: user.memberships,
  };
}

/**
 * Find user by ID
 */
export async function findUserById(id: string) {
  const user = await db.user.findUnique({
    where: { id },
  });

  return serializeUser(user);
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  const user = await db.user.findUnique({
    where: { email },
  });

  return serializeUser(user);
}

/**
 * Find organization owned by user (where user has OWNER role)
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The membership with organization or null
 */
export async function findUserOwnedOrganization(userId: string) {
  const membership = await db.membership.findFirst({
    where: {
      userId,
      role: "OWNER",
    },
    include: {
      organization: true,
    },
  });

  return membership;
}
