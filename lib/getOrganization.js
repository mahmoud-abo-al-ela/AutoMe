import { headers, cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/prisma";

/**
 * Get organization by slug with subscription and plan details
 * Cached per request to avoid duplicate database calls
 */
export const getOrganizationBySlug = cache(async (slug) => {
  if (!slug) return null;

  return db.organization.findUnique({
    where: { slug, isActive: true },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });
});

/**
 * Get organization by ID with subscription and plan details
 */
export const getOrganizationById = cache(async (id) => {
  if (!id) return null;

  return db.organization.findUnique({
    where: { id, isActive: true },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });
});

/**
 * Get current organization from request context (headers set by middleware)
 * This is the primary way to get the current org in server components
 */
export async function getCurrentOrganization() {
  const headersList = await headers();
  const slug = headersList.get("x-organization-slug");

  if (!slug) return null;

  return getOrganizationBySlug(slug);
}

/**
 * Get subdomain from request headers (set by middleware)
 */
export async function getSubdomain() {
  const headersList = await headers();
  return headersList.get("x-subdomain");
}

/**
 * Check if current request is in impersonation mode
 */
export async function getImpersonationContext() {
  const headersList = await headers();

  const isActive = headersList.get("x-impersonation-active") === "true";
  if (!isActive) return null;

  return {
    organizationSlug: headersList.get("x-impersonated-org"),
    userId: headersList.get("x-impersonated-user"),
    sessionId: headersList.get("x-impersonation-session"),
  };
}

/**
 * Check if user has access to organization with required role
 * @param {string} userId - Database user ID
 * @param {string} organizationId - Organization ID
 * @param {string|null} requiredRole - Minimum role required (OWNER > ADMIN > MEMBER)
 * @returns {Promise<boolean>}
 */
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

/**
 * Get user's membership in an organization
 */
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
 * Get all organizations a user is a member of
 */
export async function getUserOrganizations(userId) {
  const memberships = await db.membership.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      },
    },
    orderBy: {
      organization: { name: "asc" },
    },
  });

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
    membershipId: m.id,
  }));
}

/**
 * Check if organization has feature enabled based on plan
 * @param {object} organization - Organization with subscription.plan
 * @param {string} featureName - Feature to check (e.g., "aiProcessing", "chat")
 * @returns {boolean|object} - Feature status or config
 */
export function checkPlanFeature(organization, featureName) {
  if (!organization?.subscription?.plan?.features) {
    return false;
  }

  const features = organization.subscription.plan.features;
  return features[featureName] ?? false;
}

/**
 * Check if organization is within plan limits
 * @param {object} organization - Organization with subscription.plan
 * @param {string} limitName - Limit to check (e.g., "maxCars", "maxMembers")
 * @param {number} currentCount - Current usage count
 * @returns {boolean}
 */
export function checkPlanLimit(organization, limitName, currentCount) {
  if (!organization?.subscription?.plan) {
    return false;
  }

  const limit = organization.subscription.plan[limitName];

  // -1 means unlimited
  if (limit === -1) return true;

  return currentCount < limit;
}

/**
 * Get plan limits for an organization
 */
export function getPlanLimits(organization) {
  if (!organization?.subscription?.plan) {
    return {
      maxCars: 0,
      maxMembers: 0,
      maxImagesPerCar: 0,
      maxStorageMB: 0,
    };
  }

  const plan = organization.subscription.plan;
  return {
    maxCars: plan.maxCars,
    maxMembers: plan.maxMembers,
    maxImagesPerCar: plan.maxImagesPerCar,
    maxStorageMB: plan.maxStorageMB,
    features: plan.features,
  };
}
