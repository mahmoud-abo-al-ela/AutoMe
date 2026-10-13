import { z } from "zod";
import { enforceMcpAccountTestDriveLimit } from "@/lib/middleware/with-rate-limit";
import { cancelTestDriveFor, requestTestDriveFor } from "@/lib/services/mcp/account-test-drives";
import { revalidateLocalized, revalidateRouteTree } from "@/lib/utils/revalidate";
import type { PublicTool } from "../public/tool";
import type { AccountCallerContext } from "./tools";

/**
 * Requesting and cancelling a test drive for the signed-in person (PR 15d).
 * Each request reaches a real dealership, so: at most a few a day, the
 * person is e-mailed with the app named and a way to cancel, and the
 * dealer's Activity log records it (lib/services/mcp/account-test-drives.ts).
 */

const locale = z.enum(["en", "ar"]).default("en").describe("Language for the links: en or ar.");
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("YYYY-MM-DD, in Cairo.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).describe("HH:mm, 24-hour, on the half hour.");

const testDrive = z.object({
  id: z.string(),
  status: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  car: z.string().nullable(),
  url: z.string().nullable(),
});

/** Every page that shows a test drive, as the site's own actions refresh them. */
function refreshTestDrivePages(carId: string | null) {
  if (carId) revalidateLocalized(`/cars/${carId}`);
  revalidateLocalized("/test-drive");
  revalidateRouteTree("/[locale]/org/[slug]/test-drives");
  revalidateRouteTree("/[locale]/org/[slug]/dashboard");
}

const requestInput = {
  carId: z.string().uuid().describe("The car's id, from search_cars or get_car."),
  date: day,
  startTime: time,
  endTime: time,
  notes: z.string().trim().max(500).optional().describe("Anything the dealership should know, in the person's words."),
  locale,
};
const requestOutput = {
  requested: z.boolean(),
  created: z.boolean().optional().describe("False when this exact request was already booked."),
  reason: z
    .string()
    .optional()
    .describe("Why it was not booked: taken, closed, outsideHours, offGrid, past, outsideWindow, invalid, car_unavailable, already_booked."),
  testDrive: testDrive.optional(),
};

export const requestTestDriveTool: PublicTool<typeof requestInput, typeof requestOutput, AccountCallerContext> = {
  name: "request_test_drive",
  title: "Request a test drive",
  description:
    "Request a test drive of a car for the signed-in person. The dealership is notified and confirms it (until then it is " +
    "PENDING); the person gets an e-mail saying this app made the request. Only ask after the person has chosen the car, " +
    "day and time. A time that cannot be booked comes back with the reason (e.g. taken), not booked. One active booking " +
    "per car; a few requests a day.",
  inputSchema: requestInput,
  outputSchema: requestOutput,
  run: async ({ locale, ...request }, caller) => {
    await enforceMcpAccountTestDriveLimit(caller.user.id, "request");
    const structured = await requestTestDriveFor(caller.user, request, caller.client, locale);
    if (structured.requested && structured.created) refreshTestDrivePages(request.carId);
    return { structured };
  },
};

const cancelInput = {
  testDriveId: z.string().uuid().describe("The test drive's id, from list_my_test_drives or request_test_drive."),
  locale,
};
const cancelOutput = {
  cancelled: z.boolean(),
  changed: z.boolean().optional().describe("False when it was already cancelled."),
  reason: z.string().optional().describe("Why it could not be cancelled: not_cancellable (already completed)."),
  testDrive,
};

export const cancelTestDriveTool: PublicTool<typeof cancelInput, typeof cancelOutput, AccountCallerContext> = {
  name: "cancel_test_drive",
  title: "Cancel a test drive",
  description:
    "Cancel one of the signed-in person's test drives, pending or confirmed. Cancelling one already cancelled changes nothing. " +
    "Only on the person's clear request: the dealership sees it.",
  inputSchema: cancelInput,
  outputSchema: cancelOutput,
  run: async ({ testDriveId, locale }, caller) => {
    await enforceMcpAccountTestDriveLimit(caller.user.id, "cancel");
    const structured = await cancelTestDriveFor(caller.user, testDriveId, caller.client, locale);
    if (structured.changed) refreshTestDrivePages(null);
    return { structured };
  },
};
