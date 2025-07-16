"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function requestTestDrive({
  carId,
  date,
  startTime,
  endTime,
  notes = "",
}) {
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

    const car = await db.car.findUnique({
      where: {
        id: carId,
      },
    });

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    if (car.status !== "AVAILABLE") {
      return {
        success: false,
        error: "Car is not available for test drive",
      };
    }

    const testDrive = await db.testDrive.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        notes,
        status: "PENDING",
        userId: user.id,
        carId,
      },
    });

    revalidatePath("/cars/[id]");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      data: testDrive,
    };
  } catch (error) {
    console.error("Error requesting test drive:", error);
    return {
      success: false,
      error: "Failed to request test drive",
    };
  }
}

export async function getTestDrives({ status, page = 1, limit = 10 }) {
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

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (user.role !== "ADMIN") {
      filter.userId = user.id;
    }

    const totalCount = await db.testDrive.count({
      where: filter,
    });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // Get test drives with pagination
    const testDrives = await db.testDrive.findMany({
      where: filter,
      include: {
        car: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: testDrives,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error getting test drives:", error);
    return {
      success: false,
      error: "Failed to get test drives",
    };
  }
}

export async function getTestDriveById(testDriveId) {
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

    const testDrive = await db.testDrive.findUnique({
      where: {
        id: testDriveId,
      },
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

    if (!testDrive) {
      return {
        success: false,
        error: "Test drive not found",
      };
    }

    return {
      success: true,
      data: testDrive,
    };
  } catch (error) {
    console.error("Error getting test drive by id:", error);
    return {
      success: false,
      error: "Failed to get test drive by id",
    };
  }
}

export async function editTestDrive({
  testDriveId,
  date,
  startTime,
  endTime,
  notes = "",
}) {
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

    // Check if test drive exists and belongs to the user
    const existingTestDrive = await db.testDrive.findUnique({
      where: {
        id: testDriveId,
      },
    });

    if (!existingTestDrive) {
      return {
        success: false,
        error: "Test drive not found",
      };
    }

    // Only allow editing if the test drive belongs to the user or if the user is an admin
    if (existingTestDrive.userId !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: You can only edit your own test drives",
      };
    }

    // Only allow editing if the test drive is still pending or confirmed
    if (!["PENDING", "CONFIRMED"].includes(existingTestDrive.status)) {
      return {
        success: false,
        error: `Cannot edit a test drive that is ${existingTestDrive.status.toLowerCase()}`,
      };
    }

    // Update the test drive
    const updatedTestDrive = await db.testDrive.update({
      where: {
        id: testDriveId,
      },
      data: {
        date: new Date(date),
        startTime,
        endTime,
        notes,
        // Reset to pending if it was confirmed before
        status:
          existingTestDrive.status === "CONFIRMED"
            ? "PENDING"
            : existingTestDrive.status,
      },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            year: true,
          },
        },
      },
    });

    revalidatePath("/cars/[id]");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/test-drives");

    return {
      success: true,
      data: updatedTestDrive,
    };
  } catch (error) {
    console.error("Error editing test drive:", error);
    return {
      success: false,
      error: "Failed to edit test drive",
    };
  }
}

export async function cancelTestDriveByUser(testDriveId) {
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

    // Check if test drive exists and belongs to the user
    const testDrive = await db.testDrive.findUnique({
      where: {
        id: testDriveId,
      },
    });

    if (!testDrive) {
      return {
        success: false,
        error: "Test drive not found",
      };
    }

    // Only allow cancellation if the test drive belongs to the user or if the user is an admin
    if (testDrive.userId !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: You can only cancel your own test drives",
      };
    }

    // Only allow cancellation if the test drive is still pending or confirmed
    if (!["PENDING", "CONFIRMED"].includes(testDrive.status)) {
      return {
        success: false,
        error: `Cannot cancel a test drive that is ${testDrive.status.toLowerCase()}`,
      };
    }

    // Update the test drive status to cancelled
    const cancelledTestDrive = await db.testDrive.update({
      where: {
        id: testDriveId,
      },
      data: {
        status: "CANCELLED",
      },
    });

    revalidatePath("/cars/[id]");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/test-drives");

    return {
      success: true,
      data: cancelledTestDrive,
    };
  } catch (error) {
    console.error("Error cancelling test drive:", error);
    return {
      success: false,
      error: "Failed to cancel test drive",
    };
  }
}

export async function checkExistingTestDrive(carId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        exists: false,
        testDriveId: null,
      };
    }

    const user = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (!user) {
      return {
        exists: false,
        testDriveId: null,
      };
    }

    // Find active test drives (pending or confirmed) for this car by this user
    const existingTestDrive = await db.testDrive.findFirst({
      where: {
        carId,
        userId: user.id,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        id: true,
      },
    });

    return {
      exists: !!existingTestDrive,
      testDriveId: existingTestDrive ? existingTestDrive.id : null,
    };
  } catch (error) {
    console.error("Error checking existing test drive:", error);
    return {
      exists: false,
      testDriveId: null,
    };
  }
}
