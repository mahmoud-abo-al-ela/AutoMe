"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as testDriveService from "@/lib/services/test-drive";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/response";
import { AuthenticationError } from "@/lib/utils/errors";

export async function requestTestDrive(testDriveData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const testDrive = await testDriveService.requestTestDrive(testDriveData, userId);

    revalidatePath("/cars/[id]");
    revalidatePath("/admin/dashboard");

    return createSuccessResponse(testDrive, "Test drive requested successfully");
  } catch (error) {
    console.error("Error requesting test drive:", error);
    return createErrorResponse(error);
  }
}

export async function getTestDrives({ status, page = 1, limit = 10 }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const result = await testDriveService.getTestDrives(
      { status },
      { page, limit },
      userId
    );

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error getting test drives:", error);
    return createErrorResponse(error);
  }
}

export async function getTestDriveById(testDriveId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const testDrive = await testDriveService.getTestDriveById(testDriveId, userId);

    return createSuccessResponse(testDrive);
  } catch (error) {
    console.error("Error getting test drive by id:", error);
    return createErrorResponse(error);
  }
}

export async function editTestDrive({ testDriveId, date, startTime, endTime, notes = "" }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const updatedTestDrive = await testDriveService.editTestDrive(
      testDriveId,
      { date, startTime, endTime, notes },
      userId
    );

    revalidatePath("/cars/[id]");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/test-drives");

    return createSuccessResponse(updatedTestDrive, "Test drive updated successfully");
  } catch (error) {
    console.error("Error editing test drive:", error);
    return createErrorResponse(error);
  }
}

export async function cancelTestDriveByUser(testDriveId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const cancelledTestDrive = await testDriveService.cancelTestDrive(testDriveId, userId);

    revalidatePath("/cars/[id]");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/test-drives");

    return createSuccessResponse(cancelledTestDrive, "Test drive cancelled successfully");
  } catch (error) {
    console.error("Error cancelling test drive:", error);
    return createErrorResponse(error);
  }
}

export async function checkExistingTestDrive(carId) {
  try {
    const { userId } = await auth();

    const result = await testDriveService.checkExistingTestDrive(carId, userId);

    return result;
  } catch (error) {
    console.error("Error checking existing test drive:", error);
    return {
      exists: false,
      testDriveId: null,
    };
  }
}

export async function updateTestDriveStatus({ testDriveId, status }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const updatedTestDrive = await testDriveService.updateTestDriveStatus(
      testDriveId,
      status,
      userId
    );

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/test-drives");
    revalidatePath("/reservation");

    return createSuccessResponse(updatedTestDrive, `Test drive ${status.toLowerCase()} successfully`);
  } catch (error) {
    console.error("Error updating test drive status:", error);
    return createErrorResponse(error);
  }
}

export async function getBookedTimeSlots(carId, date) {
  try {
    const bookedSlots = await testDriveService.getBookedTimeSlots(carId, date);
    return createSuccessResponse(bookedSlots);
  } catch (error) {
    console.error("Error getting booked time slots:", error);
    return createErrorResponse(error);
  }
}
