// Test drive booking service functions
import * as testDriveRepository from "@/lib/repositories/test-drive";
import * as userRepository from "@/lib/repositories/user";
import * as carRepository from "@/lib/repositories/car";
import * as workingHoursRepository from "@/lib/repositories/dealership/working-hours";
import { formatWorkingHours } from "@/lib/utils/working-hours";
import {
  BOOKING_HORIZON_DAYS,
  checkBooking,
  dayOfWeekForDate,
} from "@/lib/utils/booking-slots";
import { dateOnlyToUtc } from "@/lib/utils/date-only";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "@/lib/utils/errors";

interface TestDriveFormData {
  carId: string;
  /** Calendar date, "YYYY-MM-DD", in Cairo. */
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

/**
 * Refuse a booking the form would never have offered. The form applies the
 * same rules (lib/utils/booking-slots), but a server action accepts whatever
 * a caller sends, and until this check the server stored any date and time.
 *
 * Not transactional: two requests for one slot in the same instant can both
 * pass. At a dealership's volume the second becomes a pending request the
 * dealer declines, which is the failure this would otherwise prevent.
 */
async function assertBookable(
  booking: { carId: string; organizationId: string; date: string; startTime: string; endTime: string },
  excludeTestDriveId?: string
) {
  const [rows, booked] = await Promise.all([
    workingHoursRepository.findWorkingHours(booking.organizationId),
    testDriveRepository.getBookedTimeSlots(booking.carId, booking.date, excludeTestDriveId),
  ]);
  const hours = formatWorkingHours(rows).find(
    (entry) => entry.dayKey === dayOfWeekForDate(booking.date)
  );

  const problem = checkBooking(booking, hours, booked);
  if (problem) {
    throw new ValidationError(
      `Test drive slot rejected (${problem}): ${booking.date} ${booking.startTime}-${booking.endTime}`,
      "startTime",
      {
        key: `errors.testDrive.slot.${problem}`,
        params: problem === "outsideWindow" ? { days: BOOKING_HORIZON_DAYS } : undefined,
      }
    );
  }
}

/**
 * Request a test drive
 */
export async function requestTestDrive(testDriveData: TestDriveFormData, userId: string) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const car = await carRepository.findCarById(testDriveData.carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  if (car.status !== "AVAILABLE") {
    throw new ValidationError("Car is not available for test drive", "carId", { key: "errors.testDrive.carUnavailable" });
  }

  await assertBookable({ ...testDriveData, organizationId: car.organizationId });

  return await testDriveRepository.createTestDrive({
    date: dateOnlyToUtc(testDriveData.date),
    startTime: testDriveData.startTime,
    endTime: testDriveData.endTime,
    notes: testDriveData.notes || "",
    status: "PENDING",
    userId: user.id,
    carId: testDriveData.carId,
    organizationId: car.organizationId,
  });
}

/**
 * Edit test drive
 */
export async function editTestDrive(testDriveId: string, updateData: Omit<TestDriveFormData, "carId">, userId: string) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const existingTestDrive =
    await testDriveRepository.findTestDriveById(testDriveId);
  if (!existingTestDrive) {
    throw new NotFoundError("Test drive");
  }

  const isAdmin = user.role === "ADMIN";
  // Org access must be scoped to THIS test drive's organization — being an OWNER
  // of some other dealership must not grant access across tenants.
  const isOrgOwner = user.memberships?.some(
    (m) =>
      m.organizationId === existingTestDrive.organizationId &&
      m.role === "OWNER",
  );

  if (existingTestDrive.userId !== user.id && !isAdmin && !isOrgOwner) {
    throw new AuthorizationError("You can only edit your own test drives");
  }

  if (existingTestDrive.status !== "PENDING") {
    throw new ValidationError(
      `Cannot edit a test drive that is ${existingTestDrive.status.toLowerCase()}. Only pending test drives can be edited.`,
      "status",
      { key: "errors.testDrive.notEditable" },
    );
  }

  await assertBookable(
    {
      ...updateData,
      carId: existingTestDrive.carId,
      organizationId: existingTestDrive.organizationId,
    },
    testDriveId
  );

  return await testDriveRepository.updateTestDrive(testDriveId, {
    date: dateOnlyToUtc(updateData.date),
    startTime: updateData.startTime,
    endTime: updateData.endTime,
    notes: updateData.notes || "",
    status: "PENDING",
  });
}

/**
 * Cancel test drive
 */
export async function cancelTestDrive(testDriveId: string, userId: string) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const testDrive = await testDriveRepository.findTestDriveById(testDriveId);
  if (!testDrive) {
    throw new NotFoundError("Test drive");
  }

  const isAdmin = user.role === "ADMIN";
  // Org access must be scoped to THIS test drive's organization (see editTestDrive).
  const isOrgOwner = user.memberships?.some(
    (m) => m.organizationId === testDrive.organizationId && m.role === "OWNER",
  );

  if (testDrive.userId !== user.id && !isAdmin && !isOrgOwner) {
    throw new AuthorizationError("You can only cancel your own test drives");
  }

  if (!["PENDING", "CONFIRMED"].includes(testDrive.status)) {
    throw new ValidationError(
      `Cannot cancel a test drive that is ${testDrive.status.toLowerCase()}`,
      "status",
      { key: "errors.testDrive.notCancellable" },
    );
  }

  return await testDriveRepository.updateTestDrive(testDriveId, {
    status: "CANCELLED",
  });
}

/**
 * Check if user has existing test drive for a car
 */
export async function checkExistingTestDrive(carId: string, userId?: string | null) {
  if (!userId) {
    return { exists: false, testDriveId: null };
  }

  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    return { exists: false, testDriveId: null };
  }

  const existingTestDrive = await testDriveRepository.findExistingTestDrive(
    user.id,
    carId,
  );

  return {
    exists: !!existingTestDrive,
    testDriveId: existingTestDrive ? existingTestDrive.id : null,
  };
}

/**
 * Get booked time slots for a car
 */
export async function getBookedTimeSlots(carId: string, date: string, excludeTestDriveId?: string) {
  return await testDriveRepository.getBookedTimeSlots(carId, date, excludeTestDriveId);
}

/**
 * The selling dealership's opening hours for a car, one entry per day.
 *
 * The booking calendar needs these to decide which days and half-hour slots it
 * may offer. They are the same hours already published on the dealership's
 * public detail page, so no authorization beyond the car existing is required.
 *
 * Returns `[]` when the dealership has never configured any — the caller
 * decides what to do with that.
 */
export async function getCarWorkingHours(carId: string) {
  const car = await carRepository.findCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  const rows = await workingHoursRepository.findWorkingHours(car.organizationId);
  return formatWorkingHours(rows);
}
