import type { DayOfWeek } from "@/lib/generated/prisma";
import type { WorkingHoursEntry } from "@/lib/utils/working-hours";
import { cairoNow } from "@/lib/utils/datetime";

/**
 * "Is this dealership open right now?"
 *
 * Split out of the badge component it used to live in, for two reasons.
 *
 * It returned a finished English sentence (`message: "Opens tomorrow at
 * 09:00"`), so there was nowhere to put a translation — the same problem the
 * server actions had before they started returning message keys. It now returns
 * a key plus its parameters and leaves the wording to the caller.
 *
 * And it read the clock with `new Date().getDay()` / `.getHours()`, which is
 * the *visitor's* timezone rather than the dealership's. A reader in London saw
 * a Cairo dealership shut two hours early; one in Dubai saw it open late. Egypt
 * observes DST, so a fixed offset would not have fixed it either — hence
 * `cairoNow`, which resolves the zone by name.
 */

/** Indexed by `Date.getDay()`, so Sunday first. */
const DAY_KEYS: readonly DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export interface OpenStatus {
  isOpen: boolean;
  /** A key under the `dealerships.openStatus` namespace. */
  statusKey:
    | "unavailable"
    | "closed"
    | "closesAt"
    | "opensAt"
    | "opensTomorrowAt"
    | "opensOnDayAt";
  /**
   * Message parameters. `time` is a raw "HH:mm" clock face for the caller to
   * localise; `day` is a DayOfWeek key, not a display name.
   */
  params?: { time?: string; day?: DayOfWeek };
}

/**
 * Minutes since midnight for "09:00" or "9:00 AM".
 *
 * Both shapes occur: the column is free text, and older rows were written by a
 * form that used a 12-hour picker.
 */
export function parseTimeToMinutes(
  timeStr: string | null | undefined
): number | null {
  if (!timeStr) return null;

  const cleaned = timeStr.trim().toUpperCase();

  const ampmMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(cleaned);
  if (ampmMatch) {
    let hours = Number(ampmMatch[1]);
    const minutes = Number(ampmMatch[2]);
    const period = ampmMatch[3];

    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;

    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  const match24 = /^(\d{1,2}):(\d{2})$/.exec(cleaned);
  if (match24) {
    const hours = Number(match24[1]);
    const minutes = Number(match24[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Minutes since midnight back to "HH:mm" — the shape `formatClockTime` takes,
 * so a computed closing time localises the same way a stored one does.
 */
function minutesToClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** The next day the dealership opens, searching forward from `fromDayIndex`. */
function findNextOpenDay(
  workingHours: WorkingHoursEntry[],
  fromDayIndex: number
): { day: DayOfWeek; time: string; isTomorrow: boolean } | null {
  for (let i = 1; i <= 7; i++) {
    const dayKey = DAY_KEYS[(fromDayIndex + i) % 7];
    const schedule = workingHours.find((wh) => wh.dayKey === dayKey);

    if (schedule?.isOpen && schedule.openTime) {
      return { day: dayKey, time: schedule.openTime, isTomorrow: i === 1 };
    }
  }
  return null;
}

/** `Date.getDay()`-style index for a "YYYY-MM-DD" date string. */
function dayIndexOf(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function getOpenStatus(
  workingHours: WorkingHoursEntry[] | null | undefined,
  now: Date = new Date()
): OpenStatus {
  if (!workingHours || workingHours.length === 0) {
    return { isOpen: false, statusKey: "unavailable" };
  }

  const { date, time } = cairoNow(now);
  const currentDayIndex = dayIndexOf(date);
  const currentMinutes = parseTimeToMinutes(time) ?? 0;

  const nextOpening = (): OpenStatus => {
    const next = findNextOpenDay(workingHours, currentDayIndex);
    if (!next) return { isOpen: false, statusKey: "closed" };

    return {
      isOpen: false,
      statusKey: next.isTomorrow ? "opensTomorrowAt" : "opensOnDayAt",
      params: { time: next.time, day: next.day },
    };
  };

  const todaySchedule = workingHours.find(
    (wh) => wh.dayKey === DAY_KEYS[currentDayIndex]
  );

  if (!todaySchedule?.isOpen) return nextOpening();

  const openMinutes = parseTimeToMinutes(todaySchedule.openTime);
  const closeMinutes = parseTimeToMinutes(todaySchedule.closeTime);

  if (openMinutes === null || closeMinutes === null) {
    return { isOpen: false, statusKey: "unavailable" };
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return {
      isOpen: true,
      statusKey: "closesAt",
      params: { time: minutesToClock(closeMinutes) },
    };
  }

  // Before opening: today's own opening time still applies.
  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusKey: "opensAt",
      params: { time: minutesToClock(openMinutes) },
    };
  }

  return nextOpening();
}
