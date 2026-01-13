// Test drive service - Business logic layer (Functional approach)
import * as testDriveRepository from "@/lib/repositories/test-drive";
import * as userRepository from "@/lib/repositories/user";
import * as carRepository from "@/lib/repositories/car";
import { AuthenticationError, NotFoundError, ValidationError, AuthorizationError } from "@/lib/utils/errors";

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
    });
}

/**
 * Get test drives with filters
 */
export async function getTestDrives(filters, pagination, userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    // Non-admin users can only see their own test drives
    const queryFilters = { ...filters };
    if (user.role !== "ADMIN") {
        queryFilters.userId = user.id;
    }

    return await testDriveRepository.findManyTestDrives(queryFilters, pagination);
}

/**
 * Get test drive by ID
 */
export async function getTestDriveById(testDriveId, userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    const testDrive = await testDriveRepository.findTestDriveById(testDriveId);
    if (!testDrive) {
        throw new NotFoundError("Test drive");
    }

    return testDrive;
}

/**
 * Edit test drive
 */
export async function editTestDrive(testDriveId, updateData, userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    const existingTestDrive = await testDriveRepository.findTestDriveById(testDriveId);
    if (!existingTestDrive) {
        throw new NotFoundError("Test drive");
    }

    // Only allow editing if the test drive belongs to the user or if the user is an admin
    if (existingTestDrive.userId !== user.id && user.role !== "ADMIN") {
        throw new AuthorizationError("You can only edit your own test drives");
    }

    // Only allow editing if the test drive is still pending
    if (existingTestDrive.status !== "PENDING") {
        throw new ValidationError(
            `Cannot edit a test drive that is ${existingTestDrive.status.toLowerCase()}. Only pending test drives can be edited.`,
            "status"
        );
    }

    return await testDriveRepository.updateTestDrive(testDriveId, {
        date: new Date(updateData.date),
        startTime: updateData.startTime,
        endTime: updateData.endTime,
        notes: updateData.notes || "",
        status: "PENDING", // Keep status as pending
    });
}

/**
 * Cancel test drive
 */
export async function cancelTestDrive(testDriveId, userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    const testDrive = await testDriveRepository.findTestDriveById(testDriveId);
    if (!testDrive) {
        throw new NotFoundError("Test drive");
    }

    // Only allow cancellation if the test drive belongs to the user or if the user is an admin
    if (testDrive.userId !== user.id && user.role !== "ADMIN") {
        throw new AuthorizationError("You can only cancel your own test drives");
    }

    // Only allow cancellation if the test drive is still pending or confirmed
    if (!["PENDING", "CONFIRMED"].includes(testDrive.status)) {
        throw new ValidationError(
            `Cannot cancel a test drive that is ${testDrive.status.toLowerCase()}`,
            "status"
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

    const existingTestDrive = await testDriveRepository.findExistingTestDrive(user.id, carId);

    return {
        exists: !!existingTestDrive,
        testDriveId: existingTestDrive ? existingTestDrive.id : null,
    };
}

/**
 * Update test drive status (admin only)
 */
export async function updateTestDriveStatus(testDriveId, status, userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    if (user.role !== "ADMIN") {
        throw new AuthorizationError("Only admins can update test drive status");
    }

    const testDrive = await testDriveRepository.findTestDriveById(testDriveId);
    if (!testDrive) {
        throw new NotFoundError("Test drive");
    }

    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
    if (!validStatuses.includes(status.toUpperCase())) {
        throw new ValidationError(`Invalid status: ${status}`, "status");
    }

    return await testDriveRepository.updateTestDrive(testDriveId, {
        status: status.toUpperCase(),
    });
}

/**
 * Get booked time slots for a car
 */
export async function getBookedTimeSlots(carId, date) {
    return await testDriveRepository.getBookedTimeSlots(carId, date);
}
