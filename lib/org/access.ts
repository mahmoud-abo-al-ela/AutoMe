import type { MemberRole } from "@/lib/generated/prisma";
import type { OrganizationWithPlan } from "@/lib/auth/context";
import { db } from "@/lib/prisma";
import { AuthorizationError } from "@/lib/utils/errors";

export async function checkOrganizationAccess(
  userId: string,
  organizationId: string,
  requiredRole: MemberRole | null = null
): Promise<boolean> {
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
    const roleHierarchy: Record<string, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
    const userRoleLevel = roleHierarchy[membership.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    return userRoleLevel >= requiredLevel;
  }

  return true;
}

export async function getUserMembership(userId: string, organizationId: string) {
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
export async function requireOwner(userId: string, organizationId: string) {
  const membership = await getUserMembership(userId, organizationId);
  if (!membership || membership.role !== "OWNER") {
    throw new AuthorizationError("Only owners can perform this action");
  }
  return membership;
}

export function checkPlanFeature(
  organization: OrganizationWithPlan | null | undefined,
  featureName: string
): boolean {
  if (!organization?.subscription?.plan?.features) {
    return false;
  }

  // Plan.features is free-form JSON; narrow to an object before indexing.
  const features = organization.subscription.plan.features;
  if (typeof features !== "object" || Array.isArray(features)) {
    return false;
  }

  return Boolean((features as Record<string, unknown>)[featureName] ?? false);
}

export function checkPlanLimit(
  organization: OrganizationWithPlan | null | undefined,
  limitName: "maxCars" | "maxMembers" | "maxImagesPerCar",
  currentCount: number
): boolean {
  if (!organization?.subscription?.plan) {
    return false;
  }

  const limit = organization.subscription.plan[limitName];

  if (limit === -1) return true;

  return currentCount < limit;
}

export function getPlanLimits(organization: OrganizationWithPlan | null | undefined) {
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
