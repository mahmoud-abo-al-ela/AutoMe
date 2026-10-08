import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * One dealership as the super-admin sees it: the record itself and each tab's
 * rows. Every query is by the dealership's id; only platform admins reach it.
 */

export async function findDealership(id: string) {
  return db.organization.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      address: true,
      website: true,
      city: true,
      region: true,
      isActive: true,
      pendingOwnerEmail: true,
      averageRating: true,
      totalReviews: true,
      createdAt: true,
      subscription: {
        select: {
          status: true,
          billingPeriod: true,
          currentPeriodEnd: true,
          trialEndsAt: true,
          pastDueSince: true,
          cancelAtPeriodEnd: true,
          plan: { select: { id: true, type: true, name: true, monthlyPrice: true, yearlyPrice: true, maxCars: true, maxMembers: true } },
        },
      },
      memberships: {
        where: { role: "OWNER" },
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { memberships: true } },
    },
  });
}

export async function countCarsByStatus(organizationId: string) {
  const rows = await db.car.groupBy({ by: ["status"], where: { organizationId }, _count: { _all: true } });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as Partial<Record<string, number>>;
}

export async function countTestDrivesSince(organizationId: string, since: Date) {
  const rows = await db.testDrive.groupBy({
    by: ["status"],
    where: { organizationId, createdAt: { gte: since } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as Partial<Record<string, number>>;
}

export async function countBuyerQuestionsSince(organizationId: string, since: Date) {
  return db.buyerQuestion.count({ where: { organizationId, createdAt: { gte: since } } });
}

export async function sumPaidPayments(organizationId: string) {
  const result = await db.payment.aggregate({
    where: { organizationId, status: "PAID" },
    _sum: { amountCents: true },
    _count: { _all: true },
  });
  return { cents: result._sum.amountCents ?? 0, count: result._count._all };
}

export async function findLastFailedPayment(organizationId: string) {
  return db.payment.findFirst({
    where: { organizationId, status: "FAILED" },
    orderBy: { createdAt: "desc" },
    select: { amountCents: true, createdAt: true, maskedPan: true, method: true },
  });
}

const carRowSelect = {
  id: true,
  make: true,
  model: true,
  year: true,
  price: true,
  status: true,
  mileage: true,
  images: true,
  createdAt: true,
  _count: { select: { savedBy: true, buyerQuestions: true, testDrive: true } },
} satisfies Prisma.CarSelect;

export async function findCars(args: {
  where: Prisma.CarWhereInput;
  orderBy: Prisma.CarOrderByWithRelationInput[];
  skip: number;
  take: number;
}) {
  return db.car.findMany({ ...args, select: carRowSelect });
}

export async function countCars(where: Prisma.CarWhereInput) {
  return db.car.count({ where });
}

export async function findTeam(organizationId: string) {
  return db.membership.findMany({
    where: { organizationId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      createdAt: true,
      invitedAt: true,
      acceptedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Per person: the audit entries they wrote at this dealership, optionally only one action or since a day. */
export async function countAuditByUser(organizationId: string, where: Prisma.AuditLogWhereInput = {}) {
  const rows = await db.auditLog.groupBy({
    by: ["userId"],
    where: { organizationId, ...where },
    _count: { _all: true },
  });
  return new Map(rows.flatMap((row) => (row.userId ? [[row.userId, row._count._all] as const] : [])));
}

export async function findPayments(organizationId: string) {
  return db.payment.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      purpose: true,
      status: true,
      amountCents: true,
      billingPeriod: true,
      method: true,
      maskedPan: true,
      createdAt: true,
      paidAt: true,
      plan: { select: { type: true, name: true } },
    },
  });
}

export async function findPlans() {
  return db.plan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: "asc" },
    select: { id: true, type: true, name: true, monthlyPrice: true, yearlyPrice: true, maxCars: true, maxMembers: true, maxImagesPerCar: true },
  });
}
