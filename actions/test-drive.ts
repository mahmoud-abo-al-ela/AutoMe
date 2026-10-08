"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidateLocalized, revalidateRouteTree } from "@/lib/utils/revalidate";
import * as testDriveService from "@/lib/services/test-drive";
import * as carRepository from "@/lib/repositories/car";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling, withAuth, withOrgAuth } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import {
  requestTestDriveSchema,
  editTestDriveSchema,
  updateTestDriveStatusSchema,
} from "@/lib/validations/schemas";
import { NotFoundError, ValidationError, logError } from "@/lib/utils/errors";
import { isDateString } from "@/lib/utils/date-only";
import { displayNameFor } from "@/lib/utils/userHelpers";
import { cairoNow } from "@/lib/utils/datetime";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { assertBuyerAllowed, assertNotImpersonating } from "@/lib/auth/assert-buyer";

import { db } from "@/lib/prisma";
import {
  sendTestDriveConfirmationEmail,
  sendTestDriveAdminNotificationEmail,
  sendTestDriveStatusUpdateEmail,
} from "@/lib/services/notification";

/**
 * Every page that shows a test drive: the car's page, the buyer's booking
 * page, and the dealer's list and dashboard. Dealer pages go by route tree
 * because the user-side actions have the organization's id, not its slug.
 */
function revalidateTestDrivePages(carId: string | null | undefined) {
  if (carId) revalidateLocalized(`/cars/${carId}`);
  revalidateLocalized("/test-drive");
  revalidateRouteTree("/[locale]/org/[slug]/test-drives");
  revalidateRouteTree("/[locale]/org/[slug]/dashboard");
}

export const requestTestDrive = withAuth(async (ctx, rawData) => {
  await enforceRateLimit();
  const testDriveData = validateAction(requestTestDriveSchema, rawData);

  const car = await carRepository.findCarById(testDriveData.carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  // On a subdomain, only that dealership's cars can be booked.
  const organization = await getCurrentOrganization();
  if (organization && car.organizationId !== organization.id) {
    throw new NotFoundError("Car");
  }

  assertBuyerAllowed(ctx.user, car.organizationId, "testDrive");

  // serializeTestDrive is nullable for callers that may pass nothing, but
  // createTestDrive always hands it a freshly created row.
  const testDrive = (await testDriveService.requestTestDrive(
    testDriveData,
    ctx.userId,
  ))!;

  // Fetch full data for email dispatch
  const fullTestDrive = await db.testDrive.findUnique({
    where: { id: testDrive.id },
    include: {
      car: true,
      user: true,
      organization: {
        include: { memberships: { include: { user: true } } },
      },
    },
  });

  if (fullTestDrive && fullTestDrive.user) {
    const org = fullTestDrive.organization;
    const car = fullTestDrive.car;
    const user = fullTestDrive.user;

    const ownerEmail =
      org.email ||
      org.memberships.find((m) => m.role === "OWNER")?.user?.email;

    const carName = car.title || `${car.make} ${car.model} ${car.year}`;
    const userName = displayNameFor(user);

    // Send confirmation to customer. Phone-only signups have no address, so
    // there is nowhere to send it — the booking itself already succeeded and
    // is visible in the app.
    if (user.email) {
      sendTestDriveConfirmationEmail({
        to: user.email,
        customerName: userName,
        carTitle: carName,
        date: fullTestDrive.date,
        startTime: fullTestDrive.startTime,
        endTime: fullTestDrive.endTime,
        dealershipName: org.name,
        dealershipAddress: org.address,
      }).catch((error) => {
        // Non-blocking: email failure should not fail the main operation
        logError(error);
      });
    }

    // Send notification to dealership
    if (ownerEmail) {
      sendTestDriveAdminNotificationEmail({
        to: ownerEmail,
        dealerName: org.name,
        customerName: userName,
        carTitle: carName,
        date: fullTestDrive.date,
        startTime: fullTestDrive.startTime,
        endTime: fullTestDrive.endTime,
        orgSlug: org.slug,
      }).catch((error) => {
        // Non-blocking: email failure should not fail the main operation
        logError(error);
      });
    }
  }

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

  if (["CONFIRMED", "CANCELLED"].includes(status)) {
    const fullTestDrive = await db.testDrive.findUnique({
      where: { id: testDriveId },
      include: { car: true, user: true, organization: true },
    });

    const recipient = fullTestDrive?.user?.email;
    // Cancelling a drive whose time has already passed is the dealer recording
    // that the buyer never came — not news for the buyer, so no email.
    const now = cairoNow();
    const slotDate = fullTestDrive?.date.toISOString().slice(0, 10) ?? "";
    const alreadyOver =
      !!fullTestDrive && (slotDate < now.date || (slotDate === now.date && fullTestDrive.endTime <= now.time));
    const tellBuyer = !(status === "CANCELLED" && alreadyOver);
    if (fullTestDrive && fullTestDrive.user && recipient && tellBuyer) {
      const car = fullTestDrive.car;
      const user = fullTestDrive.user;
      sendTestDriveStatusUpdateEmail({
        to: recipient,
        customerName: displayNameFor(user),
        carTitle: car.title || `${car.make} ${car.model} ${car.year}`,
        status,
        dealershipName: fullTestDrive.organization.name,
      }).catch((error) => {
        // Non-blocking: email failure should not fail the main operation
        logError(error);
      });
    }
  }

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
