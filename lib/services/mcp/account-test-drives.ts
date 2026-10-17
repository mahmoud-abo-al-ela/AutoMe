import type { Locale } from "@/i18n/routing";
import { auditHelpers } from "@/lib/services/audit/audit";
import { carUrl } from "@/lib/services/public-catalog/urls";
import * as testDriveService from "@/lib/services/test-drive";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import type { AccountCaller } from "./account";

/** Who to name for a request an app made: "Claude" for Anthropic's apps, else a generic name. */
export function mcpClientLabel(clientId: string | null | undefined): string | null {
  if (!clientId) return null;
  try {
    const host = new URL(clientId).hostname;
    if (host === "claude.ai" || host.endsWith(".claude.ai") || host === "anthropic.com" || host.endsWith(".anthropic.com")) {
      return "Claude";
    }
  } catch {
    // A dynamically registered client's id is opaque, not a URL.
  }
  return null;
}

const GENERIC_CLIENT = "an AI assistant";

interface DriveRow {
  id: string;
  status: string;
  date: unknown;
  startTime: string;
  endTime: string;
  carId?: string | null;
  organizationId?: string;
  userId?: string;
  car?: { id?: string; make?: string; model?: string; year?: number } | null;
}

const dayOf = (date: unknown) => (date instanceof Date ? date.toISOString() : String(date ?? "")).slice(0, 10);

function present(drive: DriveRow, locale: Locale) {
  const carId = drive.car?.id ?? drive.carId ?? null;
  return {
    id: drive.id,
    status: drive.status,
    date: dayOf(drive.date),
    startTime: drive.startTime,
    endTime: drive.endTime,
    car: drive.car?.make ? `${drive.car.make} ${drive.car.model} ${drive.car.year}` : null,
    url: carId ? carUrl(carId, locale, { source: "mcp", medium: "request_test_drive" }) : null,
  };
}

const SLOT_PREFIX = "errors.testDrive.slot.";

export interface TestDriveRequest {
  carId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export async function requestTestDriveFor(caller: AccountCaller, request: TestDriveRequest, client: string | null, locale: Locale) {
  // One active booking per car, as on the site (it sends you to manage the one you have).
  const existing = await testDriveService.checkExistingTestDrive(request.carId, caller.clerkId);
  if (existing.exists && existing.testDriveId) {
    const drive = (await testDriveService.getTestDriveById(existing.testDriveId, caller.clerkId)) as unknown as DriveRow;
    const sameSlot = dayOf(drive.date) === request.date && drive.startTime === request.startTime && drive.endTime === request.endTime;
    return sameSlot
      ? { requested: true, created: false, testDrive: present(drive, locale) }
      : { requested: false, reason: "already_booked" as const, testDrive: present(drive, locale) };
  }

  await testDriveService.findBookableCar(request.carId, caller.viewer);

  let booked: DriveRow;
  try {
    booked = (await testDriveService.requestTestDrive({ ...request, notes: request.notes ?? "" }, caller.clerkId)) as unknown as DriveRow;
  } catch (error) {
    if (error instanceof ValidationError && error.messageKey?.startsWith(SLOT_PREFIX)) {
      return { requested: false, reason: error.messageKey.slice(SLOT_PREFIX.length) };
    }
    if (error instanceof ValidationError && error.messageKey === "errors.testDrive.carUnavailable") {
      return { requested: false, reason: "car_unavailable" };
    }
    throw error;
  }

  // Awaited, like the site's action: each send is fire-and-forget inside.
  await testDriveService.notifyTestDriveRequested(booked.id, { requestedVia: client ?? GENERIC_CLIENT });
  await auditHelpers.logTestDriveChangedByAgent(
    { id: booked.id, organizationId: booked.organizationId!, carId: booked.carId, date: booked.date, startTime: booked.startTime },
    "requested",
    { id: caller.id, email: caller.email },
    client
  );
  return { requested: true, created: true, testDrive: present({ ...booked, carId: request.carId }, locale) };
}

export async function cancelTestDriveFor(caller: AccountCaller, testDriveId: string, client: string | null, locale: Locale) {
  // Only the caller's own booking: a dealer's staff cancel from their dashboard, not here.
  const drive = (await testDriveService.getTestDriveById(testDriveId, caller.clerkId)) as unknown as DriveRow;
  if (drive.userId !== caller.id) throw new NotFoundError("Test drive");
  if (drive.status === "CANCELLED") return { cancelled: true, changed: false, testDrive: present(drive, locale) };

  try {
    await testDriveService.cancelTestDrive(testDriveId, caller.clerkId);
  } catch (error) {
    if (error instanceof ValidationError && error.messageKey === "errors.testDrive.notCancellable") {
      return { cancelled: false, reason: "not_cancellable", testDrive: present(drive, locale) };
    }
    throw error;
  }

  await auditHelpers.logTestDriveChangedByAgent(
    { id: drive.id, organizationId: drive.organizationId!, carId: drive.carId ?? drive.car?.id, date: drive.date, startTime: drive.startTime, status: drive.status },
    "cancelled",
    { id: caller.id, email: caller.email },
    client
  );
  return { cancelled: true, changed: true, testDrive: present({ ...drive, status: "CANCELLED" }, locale) };
}
