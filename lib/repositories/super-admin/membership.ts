import { db } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

/**
 * Membership repository for Super Admin operations
 */

export async function createMembership(data: Prisma.MembershipUncheckedCreateInput) {
  return db.membership.create({
    data,
  });
}

export async function findUserMembershipInOrganization(userId: string, organizationId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: { organizationId },
      },
    },
  });
}
