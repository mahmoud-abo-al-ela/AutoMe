import { db } from "@/lib/prisma";

const DRIVE_SELECT = {
  id: true,
  date: true,
  startTime: true,
  status: true,
  user: { select: { name: true } },
  car: { select: { make: true, model: true, year: true } },
} as const;

/**
 * What the dashboard's overview puts in front of a dealer: the work waiting on
 * them and how the week is going. One round of parallel queries.
 *
 * `today` is the Cairo calendar date as a UTC midnight, which is how
 * TestDrive.date (@db.Date) compares. `since` and `before` bound the two
 * rolling weeks the request counts compare.
 */
export async function getTodayBoard(
  organizationId: string,
  { today, since, before }: { today: Date; since: Date; before: Date },
) {
  const [
    pendingNext,
    pendingCount,
    todayDrives,
    openQuestions,
    latestQuestion,
    requestedThisWeek,
    requestedLastWeek,
    savedCars,
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
      take: 8,
    }),
    db.buyerQuestion.count({ where: { organizationId, status: "OPEN" } }),
    db.buyerQuestion.findFirst({
      where: { organizationId, status: "OPEN" },
      orderBy: { lastAskedAt: "desc" },
      select: { question: true, car: { select: { make: true, model: true, year: true } } },
    }),
    db.testDrive.count({ where: { organizationId, createdAt: { gte: since } } }),
    db.testDrive.count({ where: { organizationId, createdAt: { gte: before, lt: since } } }),
    db.savedCar.groupBy({
      by: ["carId"],
      where: { car: { organizationId } },
      _count: { _all: true },
    }),
  ]);

  return {
    pendingNext,
    pendingCount,
    todayDrives,
    openQuestions,
    latestQuestion,
    requestedThisWeek,
    requestedLastWeek,
    savedTotal: savedCars.reduce((sum, row) => sum + row._count._all, 0),
    savedCarCount: savedCars.length,
  };
}

export type TodayBoard = Awaited<ReturnType<typeof getTodayBoard>>;
