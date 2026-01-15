import { db } from "@/lib/prisma";

/**
 * Plan repository for Super Admin operations
 */

export async function findPlanById(planId) {
  return db.plan.findUnique({
    where: { id: planId },
  });
}

export async function findPlanByType(type) {
  return db.plan.findUnique({
    where: { type },
  });
}

export async function findPlanWithSubscriptionCount(planId) {
  return db.plan.findUnique({
    where: { id: planId },
    include: {
      _count: {
        select: { subscriptions: true },
      },
    },
  });
}

export async function createPlan(data) {
  return db.plan.create({
    data,
  });
}

export async function updatePlan(planId, data) {
  return db.plan.update({
    where: { id: planId },
    data,
  });
}

export async function deletePlan(planId) {
  return db.plan.delete({
    where: { id: planId },
  });
}
