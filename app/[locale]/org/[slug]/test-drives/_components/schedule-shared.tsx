"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { useFormatters } from "@/hooks/use-formatters";
import { resolveCarTitle } from "@/lib/utils/car-text";
import type { ScheduleDrive } from "@/lib/services/dashboard/schedule";
import { cn } from "@/lib/utils";

/** The words the calendar puts around a drive: who, which car, when, how long. */
export function useDriveText() {
  const t = useTranslations("org.testDrives");
  const locale = useLocale() as Locale;
  const fmt = useFormatters();

  // "30 minutes", "2 hours", "1.5 hours" — and "3 hours 46 minutes" when it is neither.
  const duration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const asMinutes = (value: number) => t("duration.minutes", { count: value, value: fmt.number(value) });
    const asHours = (value: number) =>
      t("duration.hours", { count: value, value: fmt.number(value, { maximumFractionDigits: 1 }) });
    if (hours === 0) return asMinutes(rest);
    if (rest === 0 || rest === 30) return asHours(minutes / 60);
    return t("duration.mixed", { hours: asHours(hours), minutes: asMinutes(rest) });
  };

  return {
    buyer: (drive: ScheduleDrive) => drive.buyer?.trim() || t("anonymousBuyer"),
    car: (drive: ScheduleDrive) =>
      resolveCarTitle(drive.car, locale)?.text ?? `${drive.car.make} ${drive.car.model} ${fmt.number(drive.car.year, { useGrouping: false })}`,
    time: (time: string) => fmt.clockTime(time),
    range: (start: string, end: string) => t("range", { start: fmt.clockTime(start), end: fmt.clockTime(end) }),
    /** A calendar date (YYYY-MM-DD), long: "Wednesday 7 October". */
    day: (date: string, withYear = false) =>
      fmt.date(`${date}T00:00:00Z`, { weekday: "long", day: "numeric", month: "long", year: withYear ? "numeric" : undefined, timeZone: "UTC" }),
    duration,
  };
}

/**
 * Where a drive stands, in words. "Over" turns a confirmed drive into one that
 * needs an outcome, and a pending one nobody answered into a missed request.
 */
export function driveState(drive: ScheduleDrive, over: boolean) {
  if (drive.status === "PENDING") return over ? "expired" : "pending";
  if (drive.status === "CONFIRMED") return over ? "outcome" : "upcoming";
  return drive.status === "COMPLETED" ? "completed" : "cancelled";
}
export type DriveState = ReturnType<typeof driveState>;

const PILL = {
  pending: "bg-marker-soft text-[#8a5e00]",
  upcoming: "bg-[#e7eef8] text-[#1d4e9e]",
  outcome: "bg-marker-soft text-[#8a5e00]",
  completed: "bg-positive-soft text-positive",
  cancelled: "bg-muted text-foreground",
  expired: "bg-muted text-muted-foreground",
} as const;

export function DriveStatusPill({ state }: { state: DriveState }) {
  const t = useTranslations("org.testDrives.status");
  const label =
    state === "pending"
      ? t("PENDING")
      : state === "upcoming" || state === "outcome"
        ? t("CONFIRMED")
        : state === "completed"
          ? t("COMPLETED")
          : state === "cancelled"
            ? t("CANCELLED")
            : t("expired");
  return (
    <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-micro font-semibold", PILL[state])}>{label}</span>
  );
}

/** The accent down a drive card's leading edge, by state. */
export const EDGE = {
  pending: "border-s-[#a87200] bg-[#fff8dd]",
  upcoming: "border-s-[#1d4e9e]",
  outcome: "border-s-[#a87200]",
  completed: "border-s-[#1f7a5a] bg-[#f4faf7]",
  cancelled: "border-s-[#8c8170] opacity-70",
  expired: "border-s-[#8c8170] opacity-70",
} as const;
