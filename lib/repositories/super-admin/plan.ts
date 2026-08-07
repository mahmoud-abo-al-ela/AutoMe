import { db } from "@/lib/prisma";
import { Prisma, PlanType } from "@/lib/generated/prisma";

/**
 * Plan repository for Super Admin operations
 */

export async function findPlanById(planId: string) {
  return db.plan.findUnique({
    where: { id: planId },
  });
}

export async function findPlanByType(type: PlanType) {
  return db.plan.findUnique({
    where: { type },
  });
}

export async function findPlanWithSubscriptionCount(planId: string) {
  return db.plan.findUnique({
    where: { id: planId },
    include: {
      _count: {
        select: { subscriptions: true },
      },
    },
  });
}

export async function createPlan(data: Prisma.PlanUncheckedCreateInput) {
  return db.plan.create({
    data,
  });
}

export async function updatePlan(planId: string, data: Prisma.PlanUncheckedUpdateInput) {
  return db.plan.update({
    where: { id: planId },
    data,
  });
}

export async function deletePlan(planId: string) {
  return db.plan.delete({
    where: { id: planId },
  });
}
