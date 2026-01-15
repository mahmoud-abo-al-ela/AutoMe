import { db } from "@/lib/prisma";

/**
 * Validate that a user is a Super Admin
 */
export async function validateSuperAdmin(superAdminId) {
  const superAdmin = await db.user.findUnique({
    where: { id: superAdminId },
  });

  if (!superAdmin || superAdmin.role !== "SUPER_ADMIN") {
    throw new Error("Only Super Admins can impersonate users");
  }

  return superAdmin;
}

/**
 * Validate that target user has access to the organization
 */
export async function validateTargetMembership(targetUserId, targetOrganizationId) {
  const targetMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: targetUserId,
        organizationId: targetOrganizationId,
      },
    },
    include: {
      user: true,
      organization: true,
    },
  });

  if (!targetMembership) {
    throw new Error("Target user does not have access to this organization");
  }

  return targetMembership;
}
