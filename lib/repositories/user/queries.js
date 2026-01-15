// User query functions
import { db } from "@/lib/prisma";
import { serializeUser } from "@/lib/utils/serializers";

/**
 * Find user by Clerk ID
 */
export async function findUserByClerkId(clerkId) {
  const user = await db.user.findUnique({
    where: { clerkId },
  });

  return serializeUser(user);
}

/**
 * Find user by Clerk ID with memberships (for role checking)
 */
export async function findUserByClerkIdWithMemberships(clerkId) {
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
export async function findUserById(id) {
  const user = await db.user.findUnique({
    where: { id },
  });

  return serializeUser(user);
}

/**
 * Find user by email
 */
export async function findUserByEmail(email) {
  const user = await db.user.findUnique({
    where: { email },
  });

  return serializeUser(user);
}
