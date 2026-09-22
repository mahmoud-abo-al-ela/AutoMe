import { format as dateFnsFormat, formatDistanceToNow } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import type { Locale } from "@/i18n/routing";
import { APP_TIME_ZONE, intlLocale } from "./intl-locale";

/**
 * Date and time formatting for AutoMe.
 *
 * Exists for the same reason as `currency.ts` and `units.ts`: before it, 23
 * call sites hardcoded "en-US", so every date in the product rendered in US
 * order (month/day) regardless of the reader's language — on an Egypt-only
 * product where both locales use day/month.
 *
 * Two rules are enforced here rather than at the call sites:
 *
 * - **Times are formatted in Africa/Cairo, by name.** Egypt reinstated DST in
 *   2023, so the offset changes twice a year and a hardcoded +02:00 is wrong
 *   for part of the year. Leaving the zone unset is also wrong: it would render
 *   in the *server's* zone, which is typically UTC.
 * - **Eastern Arabic numerals in Arabic**, via `intlLocale`. See that file.
 */

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

/** True for values that would render as "Invalid Date". */
function isValid(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/**
 * Format a date. Defaults to a medium, unambiguous form ("15 Aug 2026") rather
 * than a numeric one, because 03/08 reads as two different days either side of
 * the Atlantic and this product serves both audiences.
 */
export function formatDate(
  value: DateInput,
  locale: Locale = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(value);
  if (!isValid(date)) return "";

  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(date);
}

/** Format a time of day, in Cairo. */
export function formatTime(
  value: DateInput,
  locale: Locale = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(value);
  if (!isValid(date)) return "";

  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(date);
}

/** A bare clock string, as WorkingHours stores one: "9:00", "09:00", "17:30". */
const CLOCK_PATTERN = /^\s*(\d{1,2}):(\d{2})\s*$/;

/**
 * Format a bare "HH:mm" wall-clock string.
 *
 * `WorkingHours.openTime`/`closeTime` and `TestDrive.startTime`/`endTime` hold
 * a clock face, not an instant: no date, no zone. They were rendered raw, so
 * an Arabic reader saw "09:00" in Latin digits with no meridiem while every
 * date beside it was in Arabic.
 *
 * Anchored to an arbitrary UTC day and formatted in UTC, deliberately: running
 * these through `Africa/Cairo` would apply the offset to a time that never had
 * one and display an hour the dealership never chose.
 *
 * Returns the input unchanged when it is not "HH:mm", so a malformed column
 * degrades to the raw value rather than to "Invalid Date".
 */
/**
 * The current date and wall-clock time in Africa/Cairo, as "YYYY-MM-DD" and
 * "HH:mm".
 *
 * Anything asking "is it open right now?" or "has this slot passed?" has to ask
 * in the dealership's zone. `new Date().getHours()` answers in the *visitor's*
 * zone, so a reader in London would see a Cairo dealership close two hours
 * early — and the server, usually on UTC, would disagree with both.
 */
export function cairoNow(now: Date = new Date()): {
  date: string;
  time: string;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    // h23 rather than hour12:false — the latter renders midnight as "24" on
    // some ICU builds, which would compare above every slot and empty the day.
    hourCycle: "h23",
  }).formatToParts(now);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

export function formatClockTime(value: string, locale: Locale = "en"): string {
  const match = CLOCK_PATTERN.exec(value ?? "");
  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return value;

  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hours, minutes)));
}

/**
 * The locale's own AM/PM markers — "ص" and "م" in Arabic.
 *
 * Read out of Intl rather than written into a message file, so the marker
 * beside a time input and the one inside a formatted time cannot disagree.
 */
export function dayPeriodLabels(locale: Locale = "en"): {
  am: string;
  pm: string;
} {
  const format = new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    hour12: true,
    timeZone: "UTC",
  });

  const marker = (hour: number) =>
    format
      .formatToParts(new Date(Date.UTC(2000, 0, 1, hour)))
      .find((part) => part.type === "dayPeriod")?.value ??
    (hour < 12 ? "AM" : "PM");

  return { am: marker(9), pm: marker(21) };
}

/** Which half of the day a "HH:mm" clock string falls in, or null if malformed. */
export function dayPeriodOf(value: string): "am" | "pm" | null {
  const parts = clockParts(value);
  return parts ? (parts.hours < 12 ? "am" : "pm") : null;
}

/**
 * The same clock time in the other half of the day: 09:00 becomes 21:00 and
 * back again.
 *
 * Twelve hours forward modulo the day, not a branch on am/pm, because that is
 * the same arithmetic in both directions and has no midnight/noon special case
 * to get wrong. Malformed input is returned untouched.
 */
export function flipDayPeriod(value: string): string {
  const parts = clockParts(value);
  if (!parts) return value;

  const hours = (parts.hours + 12) % 24;

  return `${String(hours).padStart(2, "0")}:${String(parts.minutes).padStart(
    2,
    "0"
  )}`;
}

/** Shared parse for the two above. Null for anything that is not "HH:mm". */
function clockParts(value: string): { hours: number; minutes: number } | null {
  const match = CLOCK_PATTERN.exec(value ?? "");
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours > 23 || minutes > 59 ? null : { hours, minutes };
}

/** Format a date and time together. */
export function formatDateTime(
  value: DateInput,
  locale: Locale = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(value);
  if (!isValid(date)) return "";

  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(date);
}

/** The date-fns locale object for a given app locale. */
export function dateFnsLocale(locale: Locale) {
  return locale === "ar" ? arLocale : enUS;
}

/**
 * `date-fns` `format` with the locale injected.
 *
 * Prefer `formatDate` above; this exists for the call sites that need a
 * specific pattern (a weekday header, an ISO-ish key) rather than a
 * locale-chosen one. Note that date-fns formats in the *runtime's* zone, so
 * this is for wall-clock patterns, not for instants.
 */
export function formatPattern(
  value: DateInput,
  pattern: string,
  locale: Locale = "en"
): string {
  const date = toDate(value);
  if (!isValid(date)) return "";

  return dateFnsFormat(date, pattern, { locale: dateFnsLocale(locale) });
}

/**
 * Chat-list timestamp: clock time today, weekday within the week, date beyond.
 *
 * Extracted from the two Stream channel previews, which each carried an
 * identical copy hardcoded to "en-US" — so localizing one and not the other
 * would have left two visibly different date formats in the same sidebar.
 */
export function formatMessageTimestamp(
  value: DateInput | null | undefined,
  locale: Locale = "en"
): string {
  if (!value) return "";
  const date = toDate(value);
  if (!isValid(date)) return "";

  const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);

  if (hoursAgo < 24) {
    return formatTime(date, locale, { hour12: true });
  }
  if (hoursAgo < 24 * 7) {
    return formatDate(date, locale, {
      weekday: "short",
      day: undefined,
      month: undefined,
      year: undefined,
    });
  }
  return formatDate(date, locale, { day: "numeric", month: "short", year: undefined });
}

/** "3 days ago" / "منذ ٣ أيام", with the locale applied. */
export function formatRelativeToNow(
  value: DateInput,
  locale: Locale = "en",
  options?: { addSuffix?: boolean }
): string {
  const date = toDate(value);
  if (!isValid(date)) return "";

  return formatDistanceToNow(date, {
    addSuffix: true,
    ...options,
    locale: dateFnsLocale(locale),
  });
}
