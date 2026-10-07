import { db } from "@/lib/prisma";

const DRIVE_SELECT = {
  id: true,
  date: true,
  startTime: true,
  endTime: true,
  status: true,
  notes: true,
  createdAt: true,
  user: { select: { name: true } },
  car: { select: { id: true, make: true, model: true, year: true, title: true, titleEn: true, titleAr: true, images: true } },
} as const;

/**
 * Every booking in a span of days, light: enough for the month calendar to
 * draw a dot per drive and mark a day whose drives still need an outcome.
 * Cancelled drives are left out; they take no time and need nothing.
 */
export async function findDrivesBetween(organizationId: string, from: Date, to: Date) {
  return db.testDrive.findMany({
    where: { organizationId, date: { gte: from, lte: to }, status: { not: "CANCELLED" } },
    select: { date: true, endTime: true, status: true },
  });
}

/** One day's bookings, every status, in time order. */
export async function findDrivesOn(organizationId: string, date: Date) {
  return db.testDrive.findMany({
    where: { organizationId, date },
    select: DRIVE_SELECT,
    orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Confirmed drives whose time has passed with no outcome recorded: any
 * earlier day, or today with the slot already over. Most recent first.
 */
export async function findDrivesNeedingOutcome(organizationId: string, today: Date, nowTime: string) {
  return db.testDrive.findMany({
    where: {
      organizationId,
      status: "CONFIRMED",
      OR: [{ date: { lt: today } }, { date: today, endTime: { lte: nowTime } }],
    },
    select: DRIVE_SELECT,
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 20,
  });
}

/** The dealership's opening hours, all of them: one row may cover several weekdays. */
export async function findWorkingHours(organizationId: string) {
  return db.workingHours.findMany({
    where: { organizationId },
    select: { dayOfWeek: true, openTime: true, closeTime: true, isOpen: true },
  });
}
