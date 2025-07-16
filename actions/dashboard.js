"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getDashboardStats() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }
    const user = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }
    const users = await db.user.count();
    const cars = await db.car.count();
    const testDrives = await db.testDrive.count();
    return {
      success: true,
      data: {
        users,
        cars,
        testDrives,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard stats",
    };
  }
}

export async function getOverviewChartData() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }
    const users = await db.user.findMany({
      select: {
        createdAt: true,
        id: true,
      },
    });
    const cars = await db.car.findMany({
      select: {
        createdAt: true,
        id: true,
      },
    });
    const testDrives = await db.testDrive.findMany({
      select: {
        createdAt: true,
        id: true,
      },
    });

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

    const chartData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Return just the array directly without nesting it in a data property
    return chartData;
  } catch (error) {
    console.error("Error fetching overview chart data:", error);
    return [];
  }
}
