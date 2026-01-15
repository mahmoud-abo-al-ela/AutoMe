import { createAuditLog } from "./audit";

/**
 * Test drive audit log helpers
 */

export async function logTestDriveCreated(testDrive, userId, userEmail) {
  return createAuditLog({
    action: "TEST_DRIVE_CREATED",
    entityType: "TEST_DRIVE",
    entityId: testDrive.id,
    organizationId: testDrive.organizationId,
    userId,
    userEmail,
    newValue: { date: testDrive.date, carId: testDrive.carId },
  });
}

export async function logTestDriveStatusChanged(
  testDrive,
  oldStatus,
  userId,
  userEmail
) {
  const actionMap = {
    CONFIRMED: "TEST_DRIVE_CONFIRMED",
    CANCELLED: "TEST_DRIVE_CANCELED",
    COMPLETED: "TEST_DRIVE_COMPLETED",
  };

  return createAuditLog({
    action: actionMap[testDrive.status] || "TEST_DRIVE_UPDATED",
    entityType: "TEST_DRIVE",
    entityId: testDrive.id,
    organizationId: testDrive.organizationId,
    userId,
    userEmail,
    oldValue: { status: oldStatus },
    newValue: { status: testDrive.status },
  });
}
