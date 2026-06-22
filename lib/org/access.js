import { db } from "@/lib/prisma";
import { AuthorizationError } from "@/lib/utils/errors";

export async function checkOrganizationAccess(
  userId,
  organizationId,
  requiredRole = null
) {
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership) return false;

  if (requiredRole) {
    const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
    const userRoleLevel = roleHierarchy[membership.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    return userRoleLevel >= requiredLevel;
  }

  return true;
}

export async function getUserMembership(userId, organizationId) {
  return db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      organization: {
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      },
    },
  });
}

/**
 * Ensures the user is the OWNER of the organization.
 * Throws an AuthorizationError if not.
 */
export async function requireOwner(userId, organizationId) {
  const membership = await getUserMembership(userId, organizationId);
  if (!membership || membership.role !== "OWNER") {
    throw new AuthorizationError("Only owners can perform this action");
  }
  return membership;
}

export function checkPlanFeature(organization, featureName) {
  if (!organization?.subscription?.plan?.features) {
    return false;
  }

  const features = organization.subscription.plan.features;
  return features[featureName] ?? false;
}

export function checkPlanLimit(organization, limitName, currentCount) {
  if (!organization?.subscription?.plan) {
    return false;
  }

  const limit = organization.subscription.plan[limitName];

  if (limit === -1) return true;

  return currentCount < limit;
}

export function getPlanLimits(organization) {
  if (!organization?.subscription?.plan) {
    return {
      maxCars: 0,
      maxMembers: 0,
      maxImagesPerCar: 0,
    };
  }

  const plan = organization.subscription.plan;
  return {
    maxCars: plan.maxCars,
    maxMembers: plan.maxMembers,
    maxImagesPerCar: plan.maxImagesPerCar,
    features: plan.features,
  };
}
