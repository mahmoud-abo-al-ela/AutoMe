import { db } from "@/lib/prisma";

/**
 * Membership repository for Super Admin operations
 */

export async function createMembership(data) {
  return db.membership.create({
    data,
  });
}

export async function findUserMembershipInOrganization(userId, organizationId) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: { organizationId },
      },
    },
  });
}
