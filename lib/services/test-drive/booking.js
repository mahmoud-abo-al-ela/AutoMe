// Test drive booking service functions
import * as testDriveRepository from "@/lib/repositories/test-drive";
import * as userRepository from "@/lib/repositories/user";
import * as carRepository from "@/lib/repositories/car";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "@/lib/utils/errors";

/**
 * Request a test drive
 */
export async function requestTestDrive(testDriveData, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const car = await carRepository.findCarById(testDriveData.carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  if (car.status !== "AVAILABLE") {
    throw new ValidationError("Car is not available for test drive", "carId");
  }

  return await testDriveRepository.createTestDrive({
    date: new Date(testDriveData.date),
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
export async function editTestDrive(testDriveId, updateData, userId) {
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
    );
  }

  return await testDriveRepository.updateTestDrive(testDriveId, {
    date: new Date(updateData.date),
    startTime: updateData.startTime,
    endTime: updateData.endTime,
    notes: updateData.notes || "",
    status: "PENDING",
  });
}

/**
 * Cancel test drive
 */
export async function cancelTestDrive(testDriveId, userId) {
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
    );
  }

  return await testDriveRepository.updateTestDrive(testDriveId, {
    status: "CANCELLED",
  });
}

/**
 * Check if user has existing test drive for a car
 */
export async function checkExistingTestDrive(carId, userId) {
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
export async function getBookedTimeSlots(carId, date) {
  return await testDriveRepository.getBookedTimeSlots(carId, date);
}
