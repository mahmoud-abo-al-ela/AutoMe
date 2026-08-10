"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
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
import { NotFoundError, logError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";

import { db } from "@/lib/prisma";
import {
  sendTestDriveConfirmationEmail,
  sendTestDriveAdminNotificationEmail,
  sendTestDriveStatusUpdateEmail,
} from "@/lib/services/notification";

export const requestTestDrive = withAuth(async (ctx, rawData) => {
  await enforceRateLimit();
  const testDriveData = validateAction(requestTestDriveSchema, rawData);

  // Validate car belongs to current organization when on a subdomain
  const organization = await getCurrentOrganization();
  if (organization && testDriveData.carId) {
    const car = await carRepository.findCarById(testDriveData.carId);
    if (!car || car.organizationId !== organization.id) {
      throw new NotFoundError("Car");
    }
  }

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
    const userName = user.name || user.email.split("@")[0];

    // Send confirmation to customer
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

  revalidatePath("/cars/[id]");
  revalidatePath("/admin");

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
      page = 1,
      limit = 10,
    }: {
      status?: string;
      page?: number;
      limit?: number;
      // BUG (surfaced by this conversion, NOT fixed here): useAdminTestDrives
      // sends `search` and puts it in the query key, but it is neither
      // destructured here nor forwarded to the service — so the admin
      // test-drives search box has never filtered anything. Declared so the
      // call site still type-checks against what it actually sends; wiring it
      // through is its own PR.
      search?: string;
    }
  ) => {
  const organization = await getCurrentOrganization();

  const result = await testDriveService.getTestDrives(
    { status },
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
  const { testDriveId, date, startTime, endTime, notes } = validateAction(
    editTestDriveSchema,
    input,
  );

  const updatedTestDrive = await testDriveService.editTestDrive(
    testDriveId,
    { date, startTime, endTime, notes },
    ctx.userId,
  );

  revalidatePath("/cars/[id]");
  revalidatePath("/admin");
  revalidatePath("/admin/test-drives");

  return createSuccessResponse(
    updatedTestDrive,
    "Test drive updated successfully",
  );
});

export const cancelTestDriveByUser = withAuth(async (ctx, testDriveId: string) => {
  const cancelledTestDrive = await testDriveService.cancelTestDrive(
    testDriveId,
    ctx.userId,
  );

  revalidatePath("/cars/[id]");
  revalidatePath("/admin");
  revalidatePath("/admin/test-drives");

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

    if (fullTestDrive && fullTestDrive.user && fullTestDrive.user.email) {
      const car = fullTestDrive.car;
      const user = fullTestDrive.user;
      sendTestDriveStatusUpdateEmail({
        to: user.email,
        customerName: user.name || user.email.split("@")[0],
        carTitle: car.title || `${car.make} ${car.model} ${car.year}`,
        status,
        dealershipName: fullTestDrive.organization.name,
      }).catch((error) => {
        // Non-blocking: email failure should not fail the main operation
        logError(error);
      });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/test-drives");
  revalidatePath("/reservation");

  return createSuccessResponse(
    updatedTestDrive,
    `Test drive ${status.toLowerCase()} successfully`,
  );
});

export const getBookedTimeSlots = withErrorHandling(
  async (carId: string, date: string) => {
  const bookedSlots = await testDriveService.getBookedTimeSlots(carId, date);
  return createSuccessResponse(bookedSlots);
});
