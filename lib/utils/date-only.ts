import { cairoNow } from "@/lib/utils/datetime";
import { APP_TIME_ZONE } from "@/lib/utils/intl-locale";

/**
 * Calendar dates ("YYYY-MM-DD") without a zone, and the Cairo instants they
 * map to.
 *
 * A calendar date is kept as a string, and arithmetic on one runs on a UTC
 * midnight, where no zone can move it to a neighbouring day. Reading a date
 * through the runtime's zone is the trap: `new Date("2026-10-05")` is UTC
 * midnight, which `getDay()` places on the 4th anywhere west of UTC.
 *
 * Shared by test-drive booking (dates a buyer picks) and billing (the day a
 * paid period ends).
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date in "YYYY-MM-DD" form (rejects 2026-02-30). */
export function isDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    DATE_RE.test(value) &&
    dateOnlyToUtc(value).toISOString().slice(0, 10) === value
  );
}

/** The `@db.Date` value for a calendar date: midnight UTC on that day. */
export function dateOnlyToUtc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** The calendar date a `@db.Date` value holds, without a zone shifting it. */
export function utcToDateOnly(value: Date | string): string {
  return (value instanceof Date ? value.toISOString() : value).slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = dateOnlyToUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((dateOnlyToUtc(to).getTime() - dateOnlyToUtc(from).getTime()) / 86_400_000);
}

/** The Cairo calendar date an instant falls on. */
export function cairoDate(instant: Date): string {
  return cairoNow(instant).date;
}

/** Minutes Cairo is ahead of UTC at an instant. */
function cairoOffsetMinutes(instant: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, Number(p.value)])
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return Math.round((asUtc - Math.floor(instant / 60_000) * 60_000) / 60_000);
}

/**
 * The instant Cairo's clocks read 00:00 on a calendar date. Taken from the
 * IANA zone, not a fixed +02:00: Egypt has daylight saving time again (since
 * 2023), so midnight is 22:00 UTC in winter and 21:00 UTC in summer.
 */
export function cairoMidnight(date: string): Date {
  const wallAsUtc = dateOnlyToUtc(date).getTime();
  // The offset at the guess can differ from the offset at the answer on a
  // transition day; asking twice settles it.
  const first = wallAsUtc - cairoOffsetMinutes(wallAsUtc) * 60_000;
  return new Date(wallAsUtc - cairoOffsetMinutes(first) * 60_000);
}
