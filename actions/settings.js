"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as dealershipService from "@/lib/services/dealership";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/response";
import { AuthenticationError } from "@/lib/utils/errors";

export async function getDealershipInfo() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const dealership = await dealershipService.getDealershipInfo(userId);

    return createSuccessResponse(dealership);
  } catch (error) {
    console.error("Error fetching dealership info:", error);
    return createErrorResponse(error);
  }
}

export async function updateWorkingHours(workingHours) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    await dealershipService.updateWorkingHours(workingHours, userId);

    revalidatePath("/admin/settings/working-hours");
    revalidatePath("/");

    return createSuccessResponse(null, "Working hours updated successfully");
  } catch (error) {
    console.error("Error updating working hours:", error);
    return createErrorResponse(error);
  }
}

export async function getUsers(search = "", page = 1, limit = 10) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const result = await dealershipService.getUsers(search, { page, limit }, userId);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return createErrorResponse(error);
  }
}

export async function updateUserRole(targetUserId, role) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    await dealershipService.updateUserRole(targetUserId, role, userId);

    revalidatePath("/admin/settings/users");
    revalidatePath("/");

    return createSuccessResponse(null, "User role updated successfully");
  } catch (error) {
    console.error("Error updating user role:", error);
    return createErrorResponse(error);
  }
}

export async function deleteUser(targetUserId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    await dealershipService.deleteUser(targetUserId, userId);

    revalidatePath("/admin/settings/users");

    return createSuccessResponse(null, "User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    return createErrorResponse(error);
  }
}
