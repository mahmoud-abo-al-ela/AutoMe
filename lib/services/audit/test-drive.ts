import type { AuditAction } from "@/lib/generated/prisma";
import { createAuditLog } from "./audit";
import type { AuditActor } from "./car";

/**
 * Test drive audit entries: the dealer confirming, cancelling or completing a
 * booking. The car and the slot go in `newValue`, so the Activity page can say
 * "confirmed a test drive of the Kia Cerato for Thursday at 5 PM".
 */

interface AuditTestDrive {
  id: string;
  organizationId: string;
  carId?: string | null;
  date?: unknown;
  startTime?: string | null;
  status?: string | null;
}

/** The statuses with an audit action of their own; others (a no-show) are not logged. */
const ACTIONS: Record<string, AuditAction> = {
  CONFIRMED: "TEST_DRIVE_CONFIRMED",
  CANCELLED: "TEST_DRIVE_CANCELED",
  COMPLETED: "TEST_DRIVE_COMPLETED",
};

export async function logTestDriveStatusChanged(testDrive: AuditTestDrive, oldStatus: string, actor: AuditActor) {
  const action = ACTIONS[testDrive.status ?? ""];
  if (!action) return null;

  return createAuditLog({
    action,
    entityType: "TEST_DRIVE",
    entityId: testDrive.id,
    organizationId: testDrive.organizationId,
    userId: actor.id,
    userEmail: actor.email,
    oldValue: { status: oldStatus },
    newValue: {
      status: testDrive.status,
      carId: testDrive.carId ?? null,
      date: testDrive.date instanceof Date ? testDrive.date.toISOString().slice(0, 10) : (testDrive.date ?? null),
      startTime: testDrive.startTime ?? null,
    },
  });
}

/**
 * A booking made or cancelled by the buyer through an app acting for them
 * (an MCP client): the dealer's Activity shows "A buyer booked…" / "{who}
 * cancelled…", and the entry records which app it was. The site's own
 * buyer requests are not logged; these are, because no person clicked them.
 */
export async function logTestDriveChangedByAgent(
  testDrive: AuditTestDrive,
  change: "requested" | "cancelled",
  actor: AuditActor,
  client: string | null
) {
  return createAuditLog({
    action: change === "requested" ? "TEST_DRIVE_CREATED" : "TEST_DRIVE_CANCELED",
    entityType: "TEST_DRIVE",
    entityId: testDrive.id,
    organizationId: testDrive.organizationId,
    userId: actor.id,
    userEmail: actor.email,
    oldValue: change === "cancelled" ? { status: testDrive.status ?? null } : null,
    newValue: {
      status: change === "requested" ? "PENDING" : "CANCELLED",
      carId: testDrive.carId ?? null,
      date: testDrive.date instanceof Date ? testDrive.date.toISOString().slice(0, 10) : (testDrive.date ?? null),
      startTime: testDrive.startTime ?? null,
    },
    metadata: { source: "mcp", client: client ?? "unknown" },
  });
}
