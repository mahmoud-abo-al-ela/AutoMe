import type { getBookedTimeSlots } from "@/actions/test-drive";
import type { ActionResponse } from "@/lib/utils/response";
import type { DayOfWeek } from "@/lib/generated/prisma";

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

/** Indexed by `Date.getDay()`. */
const DAY_NAMES: readonly DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/** The working-hours key for a date. */
export const dayOfWeekFor = (date: Date): DayOfWeek => DAY_NAMES[date.getDay()];

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

/** Past dates and days the dealership is closed cannot be booked. */
export const makeIsDateDisabled =
  (workingHours: WorkingHours) =>
    (date: Date): boolean => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today) return true;

      return !workingHours[dayOfWeekFor(date)]?.isOpen;
    };

/** The next `days` calendar days on which the dealership is open. */
export const generateAvailableDates = (
  workingHours: WorkingHours,
  days = 14
): Date[] => {
  const today = new Date();
  const dates: Date[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    if (workingHours[dayOfWeekFor(date)]?.isOpen) {
      dates.push(date);
    }
  }

  return dates;
};

/** The form fields shared by the create and edit test-drive forms. */
export interface TestDriveFormValues {
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}
