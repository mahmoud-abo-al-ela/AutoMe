import { db } from "@/lib/prisma";

/**
 * Create a new membership
 */
export async function createMembership(data) {
  return db.membership.create({
    data,
  });
}

/**
 * Update membership role
 */
export async function updateMembership(id, data) {
  return db.membership.update({
    where: { id },
    data,
  });
}

/**
 * Delete membership
 */
export async function deleteMembership(id) {
  return db.membership.delete({
    where: { id },
  });
}
