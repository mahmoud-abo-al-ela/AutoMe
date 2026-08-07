import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/**
 * Create a new membership
 */
export async function createMembership(data: Prisma.MembershipUncheckedCreateInput) {
  return db.membership.create({
    data,
  });
}

/**
 * Update membership role
 */
export async function updateMembership(id: string, data: Prisma.MembershipUncheckedUpdateInput) {
  return db.membership.update({
    where: { id },
    data,
  });
}

/**
 * Delete membership
 */
export async function deleteMembership(id: string) {
  return db.membership.delete({
    where: { id },
  });
}
