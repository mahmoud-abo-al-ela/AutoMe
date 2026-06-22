// Billing repository - Data access layer for plans, subscriptions, and billing
import { db } from "@/lib/prisma";

/**
 * Find all active plans ordered by monthly price
 */
export async function findActivePlans() {
  return db.plan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: "asc" },
  });
}

/**
 * Find a plan by ID
 */
export async function findPlanById(planId) {
  return db.plan.findUnique({
    where: { id: planId },
  });
}

/**
 * Find a plan by type
 */
export async function findPlanByType(type) {
  return db.plan.findUnique({
    where: { type },
  });
}

/**
 * Find active subscription for an organization
 */
export async function findActiveSubscription(organizationId) {
  return db.subscription.findFirst({
    where: {
      organizationId,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Find subscription by organization ID
 */
export async function findSubscriptionByOrgId(organizationId) {
  return db.subscription.findUnique({
    where: { organizationId },
    include: {
      plan: true,
    },
  });
}

/**
 * Get usage counts for an organization
 */
export async function getUsageCounts(organizationId) {
  const [carCount, memberCount, testDriveCount] = await Promise.all([
    db.car.count({
      where: { organizationId },
    }),
    db.membership.count({
      where: { organizationId },
    }),
    db.testDrive.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(new Date().setDate(1)), // This month
        },
      },
    }),
  ]);

  return { carCount, memberCount, testDriveCount };
}

/**
 * Find billing-related audit logs for an organization
 */
export async function findBillingEvents(organizationId, limit = 10) {
  return db.auditLog.findMany({
    where: {
      organizationId,
      action: {
        in: [
          "SUBSCRIPTION_CREATED",
          "SUBSCRIPTION_UPGRADED",
          "SUBSCRIPTION_DOWNGRADED",
          "SUBSCRIPTION_CANCELED",
          "SUBSCRIPTION_RENEWED",
        ],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}
