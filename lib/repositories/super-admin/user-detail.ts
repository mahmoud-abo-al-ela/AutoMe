import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * One person as the super-admin sees them: their account, their dealerships,
 * what they did as a buyer and, for AutoMe staff, their support sessions.
 * Across every dealership by design — only platform admins reach it.
 */

export async function findUser(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      memberships: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          role: true,
          createdAt: true,
          organization: { select: { id: true, name: true, slug: true, isActive: true, subscription: { select: { status: true } } } },
        },
      },
      _count: { select: { savedCars: true, testDrives: true, dealershipReviews: true, superAdminSessions: true } },
    },
  });
}

export async function findTestDrives(userId: string, skip: number, take: number) {
  return db.testDrive.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    skip,
    take,
    select: {
      id: true,
      date: true,
      startTime: true,
      status: true,
      car: { select: { make: true, model: true, year: true } },
      organization: { select: { id: true, name: true } },
    },
  });
}

export async function countUpcomingDrives(userId: string, today: Date) {
  return db.testDrive.count({ where: { userId, date: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } } });
}

export async function findSavedCars(userId: string, skip: number, take: number) {
  return db.savedCar.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: {
      id: true,
      createdAt: true,
      car: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          price: true,
          status: true,
          images: true,
          organization: { select: { id: true, name: true } },
        },
      },
    },
  });
}

/** How many dealerships the cars they saved belong to. */
export async function countSavedDealerships(userId: string) {
  const rows = await db.car.groupBy({ by: ["organizationId"], where: { savedBy: { some: { userId } } } });
  return rows.length;
}

export async function findReviews(userId: string) {
  return db.dealershipReview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      isApproved: true,
      createdAt: true,
      organization: { select: { id: true, name: true } },
    },
  });
}

export async function averageRating(userId: string) {
  const result = await db.dealershipReview.aggregate({ where: { userId }, _avg: { rating: true } });
  return result._avg.rating;
}

export async function countAudit(where: Prisma.AuditLogWhereInput) {
  return db.auditLog.count({ where });
}

/** Their audit entries per dealership, optionally only one action or since a day. */
export async function countAuditByDealership(userId: string, where: Prisma.AuditLogWhereInput = {}) {
  const rows = await db.auditLog.groupBy({ by: ["organizationId"], where: { userId, ...where }, _count: { _all: true } });
  return new Map(rows.flatMap((row) => (row.organizationId ? [[row.organizationId, row._count._all] as const] : [])));
}

export async function findSupportSessions(adminId: string, skip: number, take: number) {
  return db.impersonationSession.findMany({
    where: { superAdminId: adminId },
    orderBy: { startedAt: "desc" },
    skip,
    take,
    select: {
      id: true,
      reason: true,
      startedAt: true,
      endedAt: true,
      targetUser: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  });
}

export async function countOpenSessions(adminId: string) {
  return db.impersonationSession.count({ where: { superAdminId: adminId, endedAt: null } });
}
