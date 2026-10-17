import { format as dateFnsFormat, formatDistanceToNow } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import type { Locale } from "@/i18n/routing";
import { APP_TIME_ZONE, intlLocale } from "./intl-locale";

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

/** True for values that would render as "Invalid Date". */
function isValid(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

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

export function formatPattern(
  value: DateInput,
  pattern: string,
  locale: Locale = "en"
): string {
  const date = toDate(value);
  if (!isValid(date)) return "";

  return dateFnsFormat(date, pattern, { locale: dateFnsLocale(locale) });
}

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

function localizeDigits(text: string, locale: Locale): string {
  const digits = new Intl.NumberFormat(intlLocale(locale), {
    useGrouping: false,
  });
  if (digits.format(0) === "0") return text;
  return text.replace(/\d/g, (d) => digits.format(Number(d)));
}

/** "3 days ago" / "منذ ٣ أيام", with the locale applied. */
export function formatRelativeToNow(
  value: DateInput,
  locale: Locale = "en",
  options?: { addSuffix?: boolean }
): string {
  const date = toDate(value);
  if (!isValid(date)) return "";

  return localizeDigits(
    formatDistanceToNow(date, {
      addSuffix: true,
      ...options,
      locale: dateFnsLocale(locale),
    }),
    locale
  );
}
