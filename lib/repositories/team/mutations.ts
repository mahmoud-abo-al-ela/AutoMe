import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { lockOrganizationResource } from "../organization-lock";

/**
 * Create a new membership
 */
export async function createMembership(data: Prisma.MembershipUncheckedCreateInput) {
  return db.membership.create({
    data,
  });
}

/**
 * Add a member only if the dealership is under its plan's member limit (-1:
 * no limit). The count and the insert run under the dealership's "members"
 * lock, so two invites for the last seat cannot both pass: one gets null.
 */
export async function createMembershipWithinLimit(data: Prisma.MembershipUncheckedCreateInput, maxMembers: number) {
  return db.$transaction(async (tx) => {
    await lockOrganizationResource(tx, data.organizationId, "members");
    if (maxMembers !== -1) {
      const count = await tx.membership.count({ where: { organizationId: data.organizationId } });
      if (count >= maxMembers) return null;
    }
    return tx.membership.create({ data });
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
