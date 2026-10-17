import { z } from "zod";
import { BOOKING_HORIZON_DAYS, type BookingProblem } from "@/lib/utils/booking-slots";
import { defineWebMcpTool, type WebMcpToolDefinition } from "@/lib/webmcp/define-tool";

export interface TestDriveToolDeps {
  checkDay: (date: string) => Promise<unknown>;
  /** Fill the form; the reason it cannot be filled, or null. */
  prepareBooking: (booking: { date: string; startTime: string; endTime: string; notes?: string }) => Promise<BookingProblem | null>;
  /** Bring the filled form, and its Submit button, to the person. */
  showForm: () => void;
}

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe(`A day in Cairo, YYYY-MM-DD, from today to ${BOOKING_HORIZON_DAYS} days ahead.`);
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .describe("HH:mm, 24-hour, on the half hour, e.g. 10:30.");

const checkInput = z.object({ date }).strict();
const prepareInput = z
  .object({
    date,
    startTime: time,
    endTime: time,
    notes: z.string().trim().max(500).optional().describe("Anything the dealership should know, in the person's words."),
  })
  .strict();

export function testDrivePageTools(deps: TestDriveToolDeps): WebMcpToolDefinition[] {
  return [
    defineWebMcpTool({
      name: "check_test_drive_availability",
      description:
        "Whether this car can be test-driven on a day: the dealership's hours, the start times still free " +
        "(every 30 minutes) and the times already booked.",
      input: checkInput,
      annotations: { readOnlyHint: true },
      run: ({ date }) => deps.checkDay(date),
    }),
    defineWebMcpTool({
      name: "prepare_test_drive_booking",
      description:
        "Fill this page's test-drive request form with a day and times, for the person to review. It does NOT " +
        "book: the request is sent only when the person presses Submit. A time that is taken, closed or past " +
        "is refused with the reason (taken, closed, outsideHours, offGrid, past, outsideWindow, invalid).",
      input: prepareInput,
      run: async (booking) => {
        const problem = await deps.prepareBooking(booking);
        if (problem) return { prepared: false, reason: problem };
        deps.showForm();
        return {
          prepared: true,
          booked: false,
          next: "Ask the person to check the form and press Submit. Nothing is booked until they do.",
        };
      },
    }),
  ];
}
