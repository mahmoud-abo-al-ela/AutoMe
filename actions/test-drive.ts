"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidateLocalized, revalidateRouteTree } from "@/lib/utils/revalidate";
import * as testDriveService from "@/lib/services/test-drive";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling, withAuth, withOrgAuth } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import {
  requestTestDriveSchema,
  editTestDriveSchema,
  updateTestDriveStatusSchema,
} from "@/lib/validations/schemas";
import { ValidationError } from "@/lib/utils/errors";
import { isDateString } from "@/lib/utils/date-only";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { assertNotImpersonating } from "@/lib/auth/assert-buyer";

function revalidateTestDrivePages(carId: string | null | undefined) {
  if (carId) revalidateLocalized(`/cars/${carId}`);
  revalidateLocalized("/test-drive");
  revalidateRouteTree("/[locale]/org/[slug]/test-drives");
  revalidateRouteTree("/[locale]/org/[slug]/dashboard");
}

export const requestTestDrive = withAuth(async (ctx, rawData) => {
  await enforceRateLimit();
  const testDriveData = validateAction(requestTestDriveSchema, rawData);

  await testDriveService.findBookableCar(testDriveData.carId, ctx.user);

  // serializeTestDrive is nullable for callers that may pass nothing, but
  // bookSlot always hands it a real row.
  const testDrive = (await testDriveService.requestTestDrive(
    testDriveData,
    ctx.userId,
  ))!;

  await testDriveService.notifyTestDriveRequested(testDrive.id);

  revalidateTestDrivePages(testDriveData.carId);

  return createSuccessResponse(
    testDrive,
    "Test drive requested successfully",
  );
});

export const getTestDrives = withAuth(
  async (
    ctx,
    {
      status,
      search,
      page = 1,
      limit = 10,
    }: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => {
  const organization = await getCurrentOrganization();

  const result = await testDriveService.getTestDrives(
    { status, search },
    { page, limit },
    ctx.userId,
    organization?.id || null,
  );

  return createSuccessResponse(result);
});

export const getTestDriveById = withAuth(async (ctx, testDriveId: string) => {
  const testDrive = await testDriveService.getTestDriveById(
    testDriveId,
    ctx.userId,
  );

  return createSuccessResponse(testDrive);
});

export const editTestDrive = withAuth(async (ctx, input) => {
  assertNotImpersonating(ctx.user);
  const { testDriveId, date, startTime, endTime, notes } = validateAction(
    editTestDriveSchema,
    input,
  );

  const updatedTestDrive = await testDriveService.editTestDrive(
    testDriveId,
    { date, startTime, endTime, notes },
    ctx.userId,
  );

  revalidateTestDrivePages(updatedTestDrive?.carId);

  return createSuccessResponse(
    updatedTestDrive,
    "Test drive updated successfully",
  );
});

export const cancelTestDriveByUser = withAuth(async (ctx, testDriveId: string) => {
  assertNotImpersonating(ctx.user);
  const cancelledTestDrive = await testDriveService.cancelTestDrive(
    testDriveId,
    ctx.userId,
  );

  revalidateTestDrivePages(cancelledTestDrive?.carId);

  return createSuccessResponse(
    cancelledTestDrive,
    "Test drive cancelled successfully",
  );
});

export const checkExistingTestDrive = withAuth(async (ctx, carId: string) => {
  const result = await testDriveService.checkExistingTestDrive(carId, ctx.userId);
  return result;
});

export const updateTestDriveStatus = withOrgAuth(async (ctx, input) => {
  const { testDriveId, status } = validateAction(updateTestDriveStatusSchema, input);

  const updatedTestDrive = await testDriveService.updateTestDriveStatus(
    testDriveId,
    status,
    ctx.userId,
    ctx.organization.id,
  );

  await testDriveService.notifyTestDriveStatusChanged(testDriveId, status);

  revalidateTestDrivePages(updatedTestDrive?.carId);

  return createSuccessResponse(
    updatedTestDrive,
    `Test drive ${status.toLowerCase()} successfully`,
  );
});

export const getBookedTimeSlots = withErrorHandling(
  async (carId: string, date: string, excludeTestDriveId?: string) => {
  if (!isDateString(date)) {
    throw new ValidationError("Date must be YYYY-MM-DD", "date", {
      key: "errors.testDrive.slot.invalid",
    });
  }
  // excludeTestDriveId only removes a booking from the busy list the caller
  // sees; the edit itself is still checked against everything else.
  const bookedSlots = await testDriveService.getBookedTimeSlots(
    carId,
    date,
    excludeTestDriveId
  );
  return createSuccessResponse(bookedSlots);
});

/**
 * The selling dealership's opening hours for a car. Public: the same hours are
 * already published on the dealership's detail page.
 */
export const getCarWorkingHours = withErrorHandling(async (carId: string) => {
  const workingHours = await testDriveService.getCarWorkingHours(carId);
  return createSuccessResponse(workingHours);
});
