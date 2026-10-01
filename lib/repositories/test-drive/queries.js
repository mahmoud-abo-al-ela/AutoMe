// Test drive query functions
import { db } from "@/lib/prisma";
import { serializeTestDrive } from "@/lib/utils/serializers";
import { dateOnlyToUtc } from "@/lib/utils/date-only";

/**
 * Find test drives with filters (organization-scoped)
 */
export async function findManyTestDrives(filters = {}, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const where = {};

  // Organization filter (CRITICAL for multi-tenancy)
  if (filters.organizationId) {
    where.organizationId = filters.organizationId;
  }

  if (filters.status && filters.status !== "all") {
    where.status = filters.status.toUpperCase();
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  // Free-text search across the car and the customer. The UI advertises "car
  // model or customer name"; make/title and email are included because they
  // are the other things an operator is likely to paste in. Combined with the
  // scoping filters above by AND, so it cannot widen past the organization.
  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    where.OR = [
      { car: { title: { contains: searchTerm, mode: "insensitive" } } },
      { car: { make: { contains: searchTerm, mode: "insensitive" } } },
      { car: { model: { contains: searchTerm, mode: "insensitive" } } },
      { user: { name: { contains: searchTerm, mode: "insensitive" } } },
      { user: { email: { contains: searchTerm, mode: "insensitive" } } },
    ];
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
 * The time ranges already taken for a car on a calendar date ("YYYY-MM-DD").
 *
 * Pending requests hold their slot as well as confirmed ones: counting only
 * CONFIRMED let a second buyer request a time someone else was waiting on,
 * leaving the dealer two requests for one car at once. `excludeId` leaves out
 * the booking being edited, which would otherwise collide with itself.
 *
 * `date` is a @db.Date column, so it is matched exactly at midnight UTC. The
 * old setHours() range was computed in the server's zone and only worked
 * because production runs in UTC.
 */
export async function getBookedTimeSlots(carId, date, excludeId) {
  const bookedTestDrives = await db.testDrive.findMany({
    where: {
      carId,
      date: dateOnlyToUtc(date),
      status: { in: ["PENDING", "CONFIRMED"] },
      ...(excludeId && { id: { not: excludeId } }),
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
