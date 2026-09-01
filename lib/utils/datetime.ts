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
export function formatClockTime(value: string, locale: Locale = "en"): string {
  const match = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(value ?? "");
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
