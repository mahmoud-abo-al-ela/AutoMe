// Test drive booking service functions
import * as testDriveRepository from "@/lib/repositories/test-drive";
import * as userRepository from "@/lib/repositories/user";
import * as carRepository from "@/lib/repositories/car";
import { isImpersonatingOrganization } from "@/lib/services/impersonation/active";
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
  ConflictError,
} from "@/lib/utils/errors";

interface TestDriveFormData {
  carId: string;
  /** Calendar date, "YYYY-MM-DD", in Cairo. */
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

async function slotCheck(
  booking: { organizationId: string; date: string; startTime: string; endTime: string }
): Promise<testDriveRepository.SlotCheck> {
  const rows = await workingHoursRepository.findWorkingHours(booking.organizationId);
  const hours = formatWorkingHours(rows).find(
    (entry) => entry.dayKey === dayOfWeekForDate(booking.date)
  );
  return ({ car, booked }) => {
    // Hidden, sold or unavailable since the page was opened: not bookable.
    if (!car) {
      throw new ValidationError("Car is not available for test drive", "carId", { key: "errors.testDrive.carUnavailable" });
    }
    const problem = checkBooking(booking, hours, booked);
    if (problem) rejectSlot(booking, problem);
  };
}

function rejectSlot(
  booking: { date: string; startTime: string; endTime: string },
  problem: NonNullable<ReturnType<typeof checkBooking>>
): never {
  throw new ValidationError(
    `Test drive slot rejected (${problem}): ${booking.date} ${booking.startTime}-${booking.endTime}`,
    "startTime",
    {
      key: `errors.testDrive.slot.${problem}`,
      params: problem === "outsideWindow" ? { days: BOOKING_HORIZON_DAYS } : undefined,
    }
  );
}

/**
 * Request a test drive
 */
export async function requestTestDrive(testDriveData: TestDriveFormData, userId: string) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const car = await carRepository.findPublicCarById(testDriveData.carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  if (car.status !== "AVAILABLE") {
    throw new ValidationError("Car is not available for test drive", "carId", { key: "errors.testDrive.carUnavailable" });
  }

  const check = await slotCheck({ ...testDriveData, organizationId: car.organizationId });
  // A repeated submission of the same request returns the booking it made.
  return await testDriveRepository.bookSlot(
    {
      carId: testDriveData.carId,
      date: dateOnlyToUtc(testDriveData.date),
      day: testDriveData.date,
      startTime: testDriveData.startTime,
      endTime: testDriveData.endTime,
    },
    { kind: "create", userId: user.id, notes: testDriveData.notes || "" },
    check
  );
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

  // Org access must be scoped to THIS test drive's organization — being an OWNER
  // of some other dealership must not grant access across tenants, and neither
  // does the platform ADMIN role without a verified support session for it.
  const isOrgOwner = user.memberships?.some(
    (m) =>
      m.organizationId === existingTestDrive.organizationId &&
      m.role === "OWNER",
  );

  if (
    existingTestDrive.userId !== user.id &&
    !isOrgOwner &&
    !(await isImpersonatingOrganization(existingTestDrive.organizationId))
  ) {
    throw new AuthorizationError("You can only edit your own test drives");
  }

  if (existingTestDrive.status !== "PENDING") {
    throw new ValidationError(
      `Cannot edit a test drive that is ${existingTestDrive.status.toLowerCase()}. Only pending test drives can be edited.`,
      "status",
      { key: "errors.testDrive.notEditable" },
    );
  }

  const check = await slotCheck({ ...updateData, organizationId: existingTestDrive.organizationId });
  const moved = await testDriveRepository.bookSlot(
    {
      carId: existingTestDrive.carId,
      date: dateOnlyToUtc(updateData.date),
      day: updateData.date,
      startTime: updateData.startTime,
      endTime: updateData.endTime,
    },
    { kind: "move", testDriveId, notes: updateData.notes || "" },
    check
  );
  // The PENDING check above ran before the lock; bookSlot repeats it under the
  // lock, and refuses a booking confirmed or cancelled in between.
  if (!moved) {
    throw new ValidationError("Only pending test drives can be edited", "status", {
      key: "errors.testDrive.notEditable",
    });
  }
  return moved;
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

  // Org access must be scoped to THIS test drive's organization (see editTestDrive).
  const isOrgOwner = user.memberships?.some(
    (m) => m.organizationId === testDrive.organizationId && m.role === "OWNER",
  );

  if (
    testDrive.userId !== user.id &&
    !isOrgOwner &&
    !(await isImpersonatingOrganization(testDrive.organizationId))
  ) {
    throw new AuthorizationError("You can only cancel your own test drives");
  }

  if (!["PENDING", "CONFIRMED"].includes(testDrive.status)) {
    throw new ValidationError(
      `Cannot cancel a test drive that is ${testDrive.status.toLowerCase()}`,
      "status",
      { key: "errors.testDrive.notCancellable" },
    );
  }

  const cancelled = await testDriveRepository.transitionTestDrive(
    testDriveId,
    testDrive.organizationId,
    ["PENDING", "CONFIRMED"],
    { status: "CANCELLED" }
  );
  if (!cancelled) {
    throw new ConflictError("The test drive changed meanwhile", { key: "errors.testDrive.changed" });
  }
  return cancelled;
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
  // The calendar of a car the public may open, and of no other.
  if (!(await carRepository.findPublicCarById(carId))) {
    throw new NotFoundError("Car");
  }
  return await testDriveRepository.getBookedTimeSlots(carId, date, excludeTestDriveId);
}

export async function getCarWorkingHours(carId: string) {
  const car = await carRepository.findPublicCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  const rows = await workingHoursRepository.findWorkingHours(car.organizationId);
  return formatWorkingHours(rows);
}
