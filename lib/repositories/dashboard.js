// Dashboard data access layer - Functional approach
import { db } from "@/lib/prisma";

/**
 * Get dashboard statistics
 */
export async function getDashboardCounts() {
    const [users, cars, testDrives] = await Promise.all([
        db.user.count(),
        db.car.count(),
        db.testDrive.count(),
    ]);

    return { users, cars, testDrives };
}

/**
 * Get overview chart data
 */
export async function getOverviewData() {
    const [users, cars, testDrives] = await Promise.all([
        db.user.findMany({
            select: {
                createdAt: true,
                id: true,
            },
        }),
        db.car.findMany({
            select: {
                createdAt: true,
                id: true,
            },
        }),
        db.testDrive.findMany({
            select: {
                createdAt: true,
                id: true,
            },
        }),
    ]);

    return { users, cars, testDrives };
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
