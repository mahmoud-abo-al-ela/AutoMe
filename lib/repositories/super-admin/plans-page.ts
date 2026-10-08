import { db } from "@/lib/prisma";

/** The plans page's rows: every plan, the subscriptions that count, and dealerships with none. */

export async function findPlans() {
  return db.plan.findMany({
    orderBy: { monthlyPrice: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
      monthlyPrice: true,
      yearlyPrice: true,
      trialDays: true,
      maxCars: true,
      maxMembers: true,
      maxImagesPerCar: true,
      auditLogRetentionDays: true,
      features: true,
      updatedAt: true,
    },
  });
}

export async function findLiveSubscriptions() {
  return db.subscription.findMany({
    where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] }, organization: { deletedAt: null } },
    select: { planId: true, status: true, billingPeriod: true, currentPeriodEnd: true, plan: { select: { monthlyPrice: true, yearlyPrice: true } } },
  });
}

/** A dealership without a subscription is on the free plan. */
export async function countDealershipsWithoutSubscription() {
  return db.organization.count({ where: { deletedAt: null, subscription: null } });
}
