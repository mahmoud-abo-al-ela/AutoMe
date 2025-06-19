"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getDealershipInfo() {
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
    let dealership = await db.dealership.findFirst({
      include: {
        workingHours: { orderBy: { dayOfWeek: "asc" } },
      },
    });
    if (!dealership) {
      dealership = await db.dealership.create({
        data: {
          workingHours: {
            create: [
              {
                dayOfWeek: ["MONDAY"],
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: ["TUESDAY"],
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: ["WEDNESDAY"],
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: ["THURSDAY"],
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: ["FRIDAY"],
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: ["SATURDAY"],
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: ["SUNDAY"],
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: false,
              },
            ],
          },
        },
        include: {
          workingHours: { orderBy: { dayOfWeek: "asc" } },
        },
      });
    }
    return {
      success: true,
      data: {
        ...dealership,
        createdAt: dealership.createdAt.toISOString(),
        updatedAt: dealership.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Error fetching working hours",
    };
  }
}

export async function updateWorkingHours(workingHours) {
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
    let dealership = await db.dealership.findFirst();
    if (!dealership) {
      return {
        success: false,
        error: "Dealership not found",
      };
    }
    await db.workingHours.deleteMany({
      where: { dealershipId: dealership.id },
    });

    for (const hour of workingHours) {
      await db.workingHours.create({
        data: {
          dayOfWeek: Array.isArray(hour.dayOfWeek)
            ? hour.dayOfWeek
            : [hour.dayOfWeek],
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isOpen: hour.isOpen,
          dealershipId: dealership.id,
        },
      });
    }
    revalidatePath("/admin/settings/working-hours");
    revalidatePath("/");
    return {
      success: true,
      message: "Working hours updated successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Error updating working hours",
    };
  }
}

export async function getUsers(search = "", page = 1, limit = 10) {
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
    const skip = (page - 1) * limit;
    const totalCount = await db.user.count({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    });
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    const serializedUsers = users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
    return {
      success: true,
      data: serializedUsers,
      pagination: {
        total: totalCount,
        page,
        limit,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error fetching users",
    };
  }
}

export async function updateUserRole(userId, role) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }
    const user = await db.user.findUnique({
      where: {
        clerkId,
      },
    });
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }
    await db.user.update({
      where: { id: userId },
      data: { role },
    });
    revalidatePath("/admin/settings/users");
    revalidatePath("/");
    return {
      success: true,
      message: "User role updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: "Error updating user role",
    };
  }
}

export async function deleteUser(userId) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Check if the authenticated user has admin privileges
    const adminUser = await db.user.findUnique({
      where: {
        clerkId,
      },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Only admins can delete users",
      };
    }

    // Check if user exists
    const userToDelete = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userToDelete) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Don't allow admins to delete themselves
    if (userToDelete.clerkId === clerkId) {
      return {
        success: false,
        error: "You cannot delete your own account",
      };
    }

    // Delete the user
    await db.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/settings/users");

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: "Error deleting user",
    };
  }
}
