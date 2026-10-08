import { db } from "@/lib/prisma";
import { AuthorizationError } from "@/lib/utils/errors";

/**
 * Validate that a user is a Super Admin
 */
export async function validateSuperAdmin(superAdminId: string) {
  const superAdmin = await db.user.findUnique({
    where: { id: superAdminId },
  });

  if (!superAdmin || superAdmin.role !== "ADMIN") {
    throw new AuthorizationError("Only admins can start support sessions");
  }

  return superAdmin;
}

/**
 * Validate that target user has access to the organization
 */
export async function validateTargetMembership(
  targetUserId: string,
  targetOrganizationId: string
) {
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
    throw new AuthorizationError("Target user does not have access to this organization", {
      key: "errors.superAdmin.targetNotMember",
    });
  }

  return targetMembership;
}
