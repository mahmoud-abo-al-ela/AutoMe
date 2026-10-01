import type { DayOfWeek } from "@/lib/generated/prisma";
import { cairoNow } from "@/lib/utils/datetime";
import { addDays, dateOnlyToUtc, isDateString } from "@/lib/utils/date-only";

/**
 * The rules for when a test drive can be booked, shared by the booking form
 * (to offer only valid choices) and the server (to refuse anything else).
 *
 * The form used to be the only place these lived, so the server stored any
 * date and times a request carried: yesterday, a Friday the dealership is
 * closed, 03:00, or a slot someone else had already taken.
 *
 * The model is a calendar date ("YYYY-MM-DD") and wall-clock times ("HH:mm"),
 * all read as Africa/Cairo. Comparing those as strings and minutes is
 * DST-safe: Egypt's clocks change around midnight, when no dealership is
 * open, and nothing here converts to an instant. What must not happen is
 * reading a date through the runtime's zone — `new Date("2026-10-05")` is
 * UTC midnight, which `getDay()` places on the 4th anywhere west of UTC —
 * so dates stay strings and weekdays are taken in UTC.
 */

export const SLOT_MINUTES = 30;

/** How far ahead a test drive can be booked, today included. */
export const BOOKING_HORIZON_DAYS = 14;

/** Indexed by `getUTCDay()`. */
const DAY_NAMES: readonly DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface TimeRange {
  startTime: string;
  endTime: string;
}

/** The working-hours key for a calendar date. */
export function dayOfWeekForDate(date: string): DayOfWeek {
  return DAY_NAMES[dateOnlyToUtc(date).getUTCDay()];
}

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const fromMinutes = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** The bookable dates, first and last, in Cairo: today plus the horizon. */
export function bookingWindow(now: Date = new Date()): { first: string; last: string } {
  const first = cairoNow(now).date;
  return { first, last: addDays(first, BOOKING_HORIZON_DAYS - 1) };
}

const overlaps = (start: number, end: number, booked: readonly TimeRange[]): boolean =>
  booked.some((b) => start < toMinutes(b.endTime) && toMinutes(b.startTime) < end);

/**
 * The end times a booking starting at `startTime` can have: every half hour
 * up to the first existing booking or closing time, whichever comes first.
 * Closing time itself is a valid end even when it is off the half-hour grid.
 *
 * The form used to offer every free slot after the start, so with 11:00
 * booked it offered 10:30–11:30 straight across it.
 */
export function endTimeOptions(
  startTime: string,
  hours: DayHours | undefined,
  booked: readonly TimeRange[]
): string[] {
  if (!hours?.isOpen || !TIME_RE.test(startTime)) return [];

  const start = toMinutes(startTime);
  const close = toMinutes(hours.closeTime);
  const ends: string[] = [];

  for (let end = start + SLOT_MINUTES; end - SLOT_MINUTES < close; end += SLOT_MINUTES) {
    const capped = Math.min(end, close);
    if (capped <= start || overlaps(start, capped, booked)) break;
    ends.push(fromMinutes(capped));
    if (capped === close) break;
  }

  return ends;
}

/** Every reason checkBooking can give; each has an errors.testDrive.slot message. */
export const BOOKING_PROBLEMS = [
  "invalid",
  "outsideWindow",
  "closed",
  "outsideHours",
  "offGrid",
  "past",
  "taken",
] as const;

export type BookingProblem = (typeof BOOKING_PROBLEMS)[number];

/**
 * Why a requested test drive cannot be booked, or null when it can.
 *
 * `hours` are the dealership's for that date's weekday; `booked` are the
 * car's existing bookings on that date (excluding the one being edited).
 */
export function checkBooking(
  request: { date: string; startTime: string; endTime: string },
  hours: DayHours | undefined,
  booked: readonly TimeRange[],
  now: Date = new Date()
): BookingProblem | null {
  const { date, startTime, endTime } = request;
  if (!isDateString(date) || !TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return "invalid";
  }

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (end <= start) return "invalid";

  const { first, last } = bookingWindow(now);
  if (date < first || date > last) return "outsideWindow";

  if (!hours?.isOpen) return "closed";

  const open = toMinutes(hours.openTime);
  const close = toMinutes(hours.closeTime);
  if (start < open || end > close) return "outsideHours";

  const onGrid = (minutes: number) => (minutes - open) % SLOT_MINUTES === 0;
  if (!onGrid(start) || (end !== close && !onGrid(end))) return "offGrid";

  // Same rule as the form's: a slot is gone once its start time is reached.
  if (date === first && startTime <= cairoNow(now).time) return "past";

  if (overlaps(start, end, booked)) return "taken";

  return null;
}
