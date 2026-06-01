// Dashboard repository - Data access layer
import { db } from "@/lib/prisma";

/**
 * Get dashboard statistics for an organization
 */
export async function getDashboardCounts(organizationId) {
  const [members, cars, testDrives] = await Promise.all([
    db.membership.count({
      where: { organizationId },
    }),
    db.car.count({
      where: { organizationId },
    }),
    db.testDrive.count({
      where: { organizationId },
    }),
  ]);

  return { users: members, cars, testDrives };
}

/**
 * Get overview chart data for an organization
 */
export async function getOverviewData(organizationId) {
  const [members, cars, testDrives] = await Promise.all([
    db.membership.findMany({
      where: { organizationId },
      select: {
        createdAt: true,
        id: true,
      },
    }),
    db.car.findMany({
      where: { organizationId },
      select: {
        createdAt: true,
        id: true,
      },
    }),
    db.testDrive.findMany({
      where: { organizationId },
      select: {
        createdAt: true,
        id: true,
      },
    }),
  ]);

  return { users: members, cars, testDrives };
}

/**
 * Aggregate data by date
 */
export function aggregateByDate(users, cars, testDrives) {
  const dateMap = new Map();

  users.forEach((user) => {
    const date = user.createdAt.toISOString().split("T")[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, users: 0, cars: 0, testDrives: 0 });
    }
    dateMap.get(date).users += 1;
  });

  cars.forEach((car) => {
    const date = car.createdAt.toISOString().split("T")[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, users: 0, cars: 0, testDrives: 0 });
    }
    dateMap.get(date).cars += 1;
  });

  testDrives.forEach((testDrive) => {
    const date = testDrive.createdAt.toISOString().split("T")[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, users: 0, cars: 0, testDrives: 0 });
    }
    dateMap.get(date).testDrives += 1;
  });

  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
}

/**
 * Get test drive conversion metrics
 */
export async function getConversionMetrics(organizationId) {
  const metrics = await db.testDrive.groupBy({
    by: ["status"],
    where: { organizationId },
    _count: true,
  });

  const result = {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };

  metrics.forEach((m) => {
    const count = m._count;
    result.total += count;
    if (m.status === "PENDING") result.pending += count;
    if (m.status === "CONFIRMED") result.confirmed += count;
    if (m.status === "COMPLETED") result.completed += count;
    if (m.status === "CANCELLED") result.cancelled += count;
  });

  return result;
}

/**
 * Get popular (most wishlisted) cars
 */
export async function getPopularCars(organizationId, limit = 5) {
  const cars = await db.car.findMany({
    where: { organizationId },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      price: true,
      images: true,
      status: true,
      _count: {
        select: { savedBy: true },
      },
    },
    orderBy: {
      savedBy: {
        _count: "desc",
      },
    },
    take: limit,
  });

  return cars.filter((car) => car._count.savedBy > 0).map((car) => ({
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    price: Number(car.price),
    image: car.images[0] || null,
    status: car.status,
    savedCount: car._count.savedBy,
  }));
}

/**
 * Get car inventory breakdown by status
 */
export async function getInventoryBreakdown(organizationId) {
  const breakdown = await db.car.groupBy({
    by: ["status"],
    where: { organizationId },
    _count: true,
  });

  const result = {
    available: 0,
    sold: 0,
    unavailable: 0,
    total: 0,
  };

  breakdown.forEach((b) => {
    const count = b._count;
    result.total += count;
    if (b.status === "AVAILABLE") result.available += count;
    if (b.status === "SOLD") result.sold += count;
    if (b.status === "UNAVAILABLE") result.unavailable += count;
  });

  return result;
}

/**
 * Get revenue and inventory metrics
 */
export async function getRevenueMetrics(organizationId) {
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [aggregate, thisMonthCount, lastMonthCount] = await Promise.all([
    db.car.aggregate({
      where: { organizationId },
      _count: true,
      _sum: { price: true },
      _avg: { price: true },
    }),
    db.car.count({
      where: {
        organizationId,
        createdAt: { gte: firstDayThisMonth },
      },
    }),
    db.car.count({
      where: {
        organizationId,
        createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth },
      },
    }),
  ]);

  return {
    totalCars: aggregate._count || 0,
    totalValue: Number(aggregate._sum.price || 0),
    averagePrice: Number(aggregate._avg.price || 0),
    addedThisMonth: thisMonthCount,
    addedLastMonth: lastMonthCount,
  };
}

/**
 * Get test drive trends over time
 */
export async function getTestDriveTrends(organizationId, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const testDrives = await db.testDrive.findMany({
    where: {
      organizationId,
      createdAt: { gte: cutoffDate },
    },
    select: {
      createdAt: true,
      status: true,
    },
  });

  const dateMap = new Map();

  // Initialize last `days` days with 0 counts
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dateMap.set(dateStr, {
      date: dateStr,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    });
  }

  // Populate data
  testDrives.forEach((td) => {
    const dateStr = td.createdAt.toISOString().split("T")[0];
    if (dateMap.has(dateStr)) {
      const entry = dateMap.get(dateStr);
      if (td.status === "PENDING") entry.pending += 1;
      if (td.status === "CONFIRMED") entry.confirmed += 1;
      if (td.status === "COMPLETED") entry.completed += 1;
      if (td.status === "CANCELLED") entry.cancelled += 1;
    }
  });

  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
}
