// Test drive query functions
import { db } from "@/lib/prisma";
import { serializeTestDrive } from "@/lib/utils/serializers";

/**
 * Find test drives with filters
 */
export async function findManyTestDrives(filters = {}, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const where = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status.toUpperCase();
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  const [testDrives, total] = await Promise.all([
    db.testDrive.findMany({
      where,
      include: {
        car: {
          select: {
            id: true,
            title: true,
            make: true,
            model: true,
            year: true,
            price: true,
            images: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.testDrive.count({ where }),
  ]);

  return {
    testDrives: testDrives.map(serializeTestDrive),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Find test drive by ID
 */
export async function findTestDriveById(id) {
  const testDrive = await db.testDrive.findUnique({
    where: { id },
    include: {
      car: {
        select: {
          id: true,
          title: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return testDrive ? serializeTestDrive(testDrive) : null;
}

/**
 * Find existing test drive for user and car
 */
export async function findExistingTestDrive(userId, carId) {
  const testDrive = await db.testDrive.findFirst({
    where: {
      carId,
      userId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
    select: {
      id: true,
    },
  });

  return testDrive;
}

/**
 * Get booked time slots for a specific car and date
 */
export async function getBookedTimeSlots(carId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedTestDrives = await db.testDrive.findMany({
    where: {
      carId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: "CONFIRMED",
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  return bookedTestDrives.map((testDrive) => ({
    startTime: testDrive.startTime,
    endTime: testDrive.endTime,
  }));
}
