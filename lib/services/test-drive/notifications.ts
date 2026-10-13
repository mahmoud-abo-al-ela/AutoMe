import type { TestDriveStatus } from "@/lib/generated/prisma";
import * as testDriveRepository from "@/lib/repositories/test-drive";
import {
  sendTestDriveConfirmationEmail,
  sendTestDriveAdminNotificationEmail,
  sendTestDriveStatusUpdateEmail,
} from "@/lib/services/notification";
import { displayNameFor } from "@/lib/utils/userHelpers";
import { cairoNow } from "@/lib/utils/datetime";
import { logError } from "@/lib/utils/errors";

/**
 * The emails a test drive sends. Each is fire-and-forget: the booking or the
 * status change has already succeeded and shows in the app, so a failed email
 * is logged, never thrown.
 */

const carTitle = (car: { title: string | null; make: string; model: string; year: number }) =>
  car.title || `${car.make} ${car.model} ${car.year}`;

/**
 * A new booking: a confirmation to the buyer and a heads-up to the
 * dealership. `requestedVia` names the app that made it for the buyer (MCP).
 */
export async function notifyTestDriveRequested(testDriveId: string, { requestedVia = null }: { requestedVia?: string | null } = {}) {
  const fullTestDrive = await testDriveRepository.findTestDriveForRequestEmails(testDriveId);
  if (!fullTestDrive || !fullTestDrive.user) return;

  const org = fullTestDrive.organization;
  const user = fullTestDrive.user;

  const ownerEmail =
    org.email ||
    org.memberships.find((m) => m.role === "OWNER")?.user?.email;

  const carName = carTitle(fullTestDrive.car);
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
      requestedVia,
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

/** A dealer confirmed or cancelled a booking: tell the buyer, when it is news to them. */
export async function notifyTestDriveStatusChanged(testDriveId: string, status: TestDriveStatus) {
  if (!["CONFIRMED", "CANCELLED"].includes(status)) return;

  const fullTestDrive = await testDriveRepository.findTestDriveForStatusEmail(testDriveId);

  const recipient = fullTestDrive?.user?.email;
  // Cancelling a drive whose time has already passed is the dealer recording
  // that the buyer never came — not news for the buyer, so no email.
  const now = cairoNow();
  const slotDate = fullTestDrive?.date.toISOString().slice(0, 10) ?? "";
  const alreadyOver =
    !!fullTestDrive && (slotDate < now.date || (slotDate === now.date && fullTestDrive.endTime <= now.time));
  const tellBuyer = !(status === "CANCELLED" && alreadyOver);
  if (fullTestDrive && fullTestDrive.user && recipient && tellBuyer) {
    sendTestDriveStatusUpdateEmail({
      to: recipient,
      customerName: displayNameFor(fullTestDrive.user),
      carTitle: carTitle(fullTestDrive.car),
      status,
      dealershipName: fullTestDrive.organization.name,
    }).catch((error) => {
      // Non-blocking: email failure should not fail the main operation
      logError(error);
    });
  }
}
