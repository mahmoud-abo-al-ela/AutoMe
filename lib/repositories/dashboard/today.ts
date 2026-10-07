import { db } from "@/lib/prisma";
import type { DayOfWeek } from "@/lib/generated/prisma";

const DRIVE_SELECT = {
  id: true,
  date: true,
  startTime: true,
  status: true,
  user: { select: { name: true } },
  car: { select: { make: true, model: true, year: true } },
} as const;

/**
 * What the dealer overview puts in front of a dealer, in one round of
 * parallel queries: the work waiting on them, today's test drives and the
 * hours they fall in, and the last 30 days against the 30 before.
 *
 * `today` is the Cairo calendar date as a UTC midnight, which is how
 * TestDrive.date (@db.Date) compares. `since`/`before` bound the two 30-day
 * windows; `monthStart` is the first of the current month.
 */
export async function getTodayBoard(
  organizationId: string,
  {
    today,
    weekday,
    since,
    before,
    monthStart,
  }: { today: Date; weekday: DayOfWeek; since: Date; before: Date; monthStart: Date },
) {
  const [
    pendingNext,
    pendingCount,
    todayDrives,
    hours,
    openQuestions,
    latestQuestion,
    requested,
    requestedBefore,
    completed,
    carsListed,
    carsAdded,
    saves,
    savesBefore,
  ] = await Promise.all([
    db.testDrive.findMany({
      where: { organizationId, status: "PENDING", date: { gte: today } },
      select: DRIVE_SELECT,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 2,
    }),
    db.testDrive.count({ where: { organizationId, status: "PENDING", date: { gte: today } } }),
    db.testDrive.findMany({
      where: { organizationId, date: today, status: { not: "CANCELLED" } },
      select: DRIVE_SELECT,
      orderBy: { startTime: "asc" },
      take: 12,
    }),
    db.workingHours.findFirst({
      where: { organizationId, dayOfWeek: { has: weekday } },
      select: { openTime: true, closeTime: true, isOpen: true },
    }),
    db.buyerQuestion.count({ where: { organizationId, status: "OPEN" } }),
    db.buyerQuestion.findFirst({
      where: { organizationId, status: "OPEN" },
      orderBy: { lastAskedAt: "desc" },
      select: { question: true, askCount: true, car: { select: { make: true, model: true, year: true } } },
    }),
    db.testDrive.count({ where: { organizationId, createdAt: { gte: since } } }),
    db.testDrive.count({ where: { organizationId, createdAt: { gte: before, lt: since } } }),
    db.testDrive.count({ where: { organizationId, createdAt: { gte: since }, status: "COMPLETED" } }),
    db.car.count({ where: { organizationId, status: "AVAILABLE" } }),
    db.car.count({ where: { organizationId, createdAt: { gte: monthStart } } }),
    db.savedCar.count({ where: { car: { organizationId }, createdAt: { gte: since } } }),
    db.savedCar.count({ where: { car: { organizationId }, createdAt: { gte: before, lt: since } } }),
  ]);

  return {
    pendingNext,
    pendingCount,
    todayDrives,
    hours,
    openQuestions,
    latestQuestion,
    requested,
    requestedBefore,
    completed,
    carsListed,
    carsAdded,
    saves,
    savesBefore,
  };
}

/**
 * The available cars, with what the "needs attention" rules read: age,
 * photos, how many test drives they have had, and what the market comparison
 * needs. Oldest first, capped — a dealership's whole stock fits.
 */
export async function findAttentionCandidates(organizationId: string) {
  const cars = await db.car.findMany({
    where: { organizationId, status: "AVAILABLE" },
    select: {
      id: true,
      make: true,
      model: true,
      bodyType: true,
      year: true,
      price: true,
      priceCurrency: true,
      images: true,
      createdAt: true,
      _count: { select: { testDrive: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return cars.map(({ price, _count, ...car }) => ({ ...car, price: Number(price), testDrives: _count.testDrive }));
}

export type TodayBoardRows = Awaited<ReturnType<typeof getTodayBoard>>;
