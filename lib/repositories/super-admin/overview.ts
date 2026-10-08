import { db } from "@/lib/prisma";

/**
 * The platform-wide counts and lists behind the super-admin home. Read-only,
 * and across every dealership by design: only platform admins reach it.
 */

export async function countDealerships() {
  const [total, active] = await Promise.all([
    db.organization.count(),
    db.organization.count({ where: { isActive: true } }),
  ]);
  return { total, active };
}

/** Subscriptions that bring money in: active, on a paid plan. */
export async function findPayingSubscriptions() {
  return db.subscription.findMany({
    where: { status: "ACTIVE", plan: { OR: [{ monthlyPrice: { gt: 0 } }, { yearlyPrice: { gt: 0 } }] } },
    select: { billingPeriod: true, plan: { select: { monthlyPrice: true, yearlyPrice: true } } },
  });
}

/*
 * The events each overview metric counts, from `since` on: one row per paid
 * invoice, new dealership, car, buyer or test-drive request. The service
 * buckets them by Cairo day. Two periods' worth of rows is small at the
 * platform's size; past a few hundred thousand, count per day in SQL instead.
 */

export async function findPaidPayments(since: Date) {
  return db.payment.findMany({
    where: { status: "PAID", paidAt: { gte: since } },
    select: { paidAt: true, amountCents: true },
  });
}

export async function findDealershipCreationDates(since: Date) {
  return db.organization.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } });
}

export async function findCarCreationDates(since: Date) {
  return db.car.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } });
}

/** Buyers: people with an account who belong to no dealership and are not admins. */
export async function findBuyerCreationDates(since: Date) {
  return db.user.findMany({
    where: { role: "USER", memberships: { none: {} }, createdAt: { gte: since } },
    select: { createdAt: true },
  });
}

export async function findTestDriveCreationDates(since: Date) {
  return db.testDrive.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } });
}

export async function countCarsByStatus() {
  const rows = await db.car.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as Partial<Record<string, number>>;
}

export async function countSubscriptionsByStatus() {
  const rows = await db.subscription.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as Partial<Record<string, number>>;
}

export async function countTestDrivesByStatus(since: Date) {
  const rows = await db.testDrive.groupBy({
    by: ["status"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as Partial<Record<string, number>>;
}

export async function findPastDueSubscriptions() {
  return db.subscription.findMany({
    where: { status: "PAST_DUE" },
    orderBy: { pastDueSince: "asc" },
    select: {
      pastDueSince: true,
      currentPeriodEnd: true,
      plan: { select: { type: true, name: true } },
      organization: { select: { id: true, name: true } },
    },
  });
}

export async function findTrialsEndingBefore(before: Date) {
  return db.subscription.findMany({
    where: { status: "TRIALING", currentPeriodEnd: { lte: before } },
    orderBy: { currentPeriodEnd: "asc" },
    select: {
      currentPeriodEnd: true,
      plan: { select: { type: true, name: true } },
      organization: { select: { id: true, name: true } },
    },
  });
}

export async function findNewDealershipsWithoutCars(since: Date) {
  return db.organization.findMany({
    where: { createdAt: { gte: since }, cars: { none: {} } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
}

export async function findOpenSupportSessions() {
  return db.impersonationSession.findMany({
    where: { endedAt: null },
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      startedAt: true,
      superAdmin: { select: { id: true, name: true, email: true } },
      targetUser: { select: { name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  });
}

/** How many dealerships are on each plan right now; one without a subscription counts as the free plan. */
export async function countDealershipsByPlanType() {
  const [rows, withoutSubscription] = await Promise.all([
    db.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
      select: { plan: { select: { type: true } } },
    }),
    db.organization.count({ where: { subscription: null } }),
  ]);
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.plan.type] = (counts[row.plan.type] ?? 0) + 1;
  if (withoutSubscription) counts.STARTER = (counts.STARTER ?? 0) + withoutSubscription;
  return counts;
}
