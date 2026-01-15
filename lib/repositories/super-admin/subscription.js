import { db } from "@/lib/prisma";

/**
 * Subscription repository for Super Admin operations
 */

export async function createSubscription(data) {
  return db.subscription.create({
    data,
  });
}

export async function updateSubscription(subscriptionId, data) {
  return db.subscription.update({
    where: { id: subscriptionId },
    data,
  });
}

export async function updateOrCreateSubscription(orgId, planId) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: { subscription: true },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  if (org.subscription) {
    return db.subscription.update({
      where: { id: org.subscription.id },
      data: { planId },
    });
  } else {
    return db.subscription.create({
      data: {
        organizationId: orgId,
        planId,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
}
