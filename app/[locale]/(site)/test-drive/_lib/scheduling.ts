import type { getBookedTimeSlots } from "@/actions/test-drive";
import type { ActionResponse } from "@/lib/utils/response";
import type { DayOfWeek } from "@/lib/generated/prisma";
import type { WorkingHoursEntry } from "@/lib/utils/working-hours";
import { format } from "date-fns";
import { cairoNow } from "@/lib/utils/datetime";
import {
  addDays,
  bookingWindow,
  dateOnlyToUtc,
  dayOfWeekForDate,
} from "@/lib/utils/booking-slots";

export { dayOfWeekForDate, endTimeOptions } from "@/lib/utils/booking-slots";

export type { DayOfWeek };

/** Unwrap an action's success payload from the ActionResponse envelope. */
type PayloadOf<T> = Awaited<T> extends ActionResponse<infer D> ? D : never;

/** One day's opening times. `openTime`/`closeTime` are "HH:mm". */
export interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export type WorkingHours = Record<DayOfWeek, DayHours>;

/** One already-booked slot for a car on a given date. */
export type BookedSlot = PayloadOf<ReturnType<typeof getBookedTimeSlots>>[number];

/** Saturday-first is the picker's business; this is just every day once. */
const DAY_NAMES: readonly DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/**
 * The working-hours key for a day the picker handed us. The picker's Date is
 * local midnight on the day clicked, so its local calendar date is that day;
 * the weekday is then taken from the date string, never from a zone.
 */
export const dayOfWeekFor = (date: Date): DayOfWeek =>
  dayOfWeekForDate(format(date, "yyyy-MM-dd"));

/**
 * Half-hour slots between two "HH:mm" times, excluding the closing time itself.
 */
export const generateTimeSlots = (
  openTime: string,
  closeTime: string
): string[] => {
  const slots: string[] = [];
  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  let currentHour = openHour;
  let currentMinute = openMinute;

  while (
    currentHour < closeHour ||
    (currentHour === closeHour && currentMinute < closeMinute)
  ) {
    slots.push(
      `${currentHour.toString().padStart(2, "0")}:${currentMinute
        .toString()
        .padStart(2, "0")}`
    );

    currentMinute += 30;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute = 0;
    }
  }

  return slots;
};

/** True when the slot falls inside any booked period. */
const isTimeSlotBooked = (timeSlot: string, bookedSlots: BookedSlot[]): boolean =>
  bookedSlots.some(
    (booked) => timeSlot >= booked.startTime && timeSlot < booked.endTime
  );

/** Drop every slot that overlaps an existing booking. */
export const filterAvailableTimeSlots = (
  allSlots: string[],
  bookedSlots: BookedSlot[]
): string[] => allSlots.filter((slot) => !isTimeSlotBooked(slot, bookedSlots));

export const filterPastTimeSlots = (
  slots: string[],
  dateString: string,
  now: Date = new Date()
): string[] => {
  const { date: today, time } = cairoNow(now);

  if (dateString !== today) return slots;

  return slots.filter((slot) => slot > time);
};

/**
 * Days outside the booking window (Cairo's today plus the horizon) and days
 * the dealership is closed cannot be picked — the same window the server
 * enforces. "Today" used to be the visitor's own, so someone abroad could be
 * offered a day Cairo had already finished, and the horizon was not applied
 * at all.
 */
export const makeIsDateDisabled =
  (workingHours: WorkingHours, now: Date = new Date()) =>
    (date: Date): boolean => {
      const day = format(date, "yyyy-MM-dd");
      const { first, last } = bookingWindow(now);
      if (day < first || day > last) return true;

      return !workingHours[dayOfWeekForDate(day)]?.isOpen;
    };

/**
 * The open days in the booking window, as the local-midnight Dates the picker
 * works in (built from the parts, so no zone moves them).
 */
export const generateAvailableDates = (
  workingHours: WorkingHours,
  now: Date = new Date()
): Date[] => {
  const { first, last } = bookingWindow(now);
  const dates: Date[] = [];

  for (let day = first; day <= last; day = addDays(day, 1)) {
    if (workingHours[dayOfWeekForDate(day)]?.isOpen) {
      const utc = dateOnlyToUtc(day);
      dates.push(new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()));
    }
  }

  return dates;
};

export const toWorkingHours = (entries: WorkingHoursEntry[]): WorkingHours => {
  const hours = {} as WorkingHours;

  for (const day of DAY_NAMES) {
    hours[day] = { isOpen: false, openTime: "", closeTime: "" };
  }

  for (const entry of entries) {
    hours[entry.dayKey] = {
      isOpen: entry.isOpen,
      openTime: entry.openTime,
      closeTime: entry.closeTime,
    };
  }

  return hours;
};

/** The form fields shared by the create and edit test-drive forms. */
export interface TestDriveFormValues {
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}
