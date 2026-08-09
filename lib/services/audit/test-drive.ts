import { createAuditLog } from "./audit";
import { AuditAction } from "@/lib/generated/prisma";

/**
 * Test drive audit log helpers
 */

interface AuditTestDrive {
  id: string;
  organizationId: string;
  date?: unknown;
  carId?: string;
  status?: string;
}

export async function logTestDriveCreated(testDrive: AuditTestDrive, userId?: string | null, userEmail?: string | null) {
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
  testDrive: AuditTestDrive,
  oldStatus: string,
  userId?: string | null,
  userEmail?: string | null
) {
  const actionMap: Record<string, AuditAction> = {
    CONFIRMED: "TEST_DRIVE_CONFIRMED",
    CANCELLED: "TEST_DRIVE_CANCELED",
    COMPLETED: "TEST_DRIVE_COMPLETED",
  };

  return createAuditLog({
    action: actionMap[testDrive.status ?? ""] || "TEST_DRIVE_UPDATED",
    entityType: "TEST_DRIVE",
    entityId: testDrive.id,
    organizationId: testDrive.organizationId,
    userId,
    userEmail,
    oldValue: { status: oldStatus },
    newValue: { status: testDrive.status },
  });
}
