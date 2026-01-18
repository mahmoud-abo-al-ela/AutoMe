import { db } from "@/lib/prisma";

/**
 * Find all members in an organization
 */
export async function findManyMembers(organizationId) {
  return db.membership.findMany({
    where: {
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Find membership by user and organization
 */
export async function findMembership(userId, organizationId) {
  return db.membership.findFirst({
    where: {
      userId,
      organizationId,
    },
  });
}

/**
 * Find membership by ID
 */
export async function findMembershipById(id) {
  return db.membership.findUnique({
    where: { id },
    include: { user: true },
  });
}

/**
 * Count members in an organization
 */
export async function countMembers(organizationId) {
  return db.membership.count({
    where: { organizationId },
  });
}

/**
 * Find user by email
 */
export async function findUserByEmail(email) {
  return db.user.findUnique({
    where: { email },
  });
}
