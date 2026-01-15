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
