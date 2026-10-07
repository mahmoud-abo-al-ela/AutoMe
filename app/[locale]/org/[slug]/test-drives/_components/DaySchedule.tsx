"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { CalendarX2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import type { ScheduleDay, ScheduleDrive } from "@/lib/services/dashboard/schedule";
import type { DriveChange } from "@/hooks/use-schedule";
import { cn } from "@/lib/utils";
import { CarThumb } from "../../_components/CarThumb";
import { DriveStatusPill, driveState, EDGE, useDriveText } from "./schedule-shared";

type Now = { date: string; time: string };
const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const isOver = (drive: ScheduleDrive, now: Now) => drive.date < now.date || (drive.date === now.date && drive.endTime <= now.time);

type Entry =
  | { kind: "drive"; at: string; drive: ScheduleDrive }
  | { kind: "free"; at: string; endTime: string; minutes: number }
  | { kind: "now"; at: string };

/**
 * The chosen day (canvas: C · Month and day): its drives and, between them,
 * the free time within opening hours — what a dealer reads off when a buyer
 * calls asking "when can I come?". Today carries the yellow "now" line.
 */
export function DaySchedule({
  day,
  now,
  base,
  pendingId,
  onChange,
  onAskCancel,
}: {
  day: ScheduleDay;
  now: Now;
  base: string;
  pendingId: string | null;
  onChange: (id: string, change: DriveChange) => void;
  onAskCancel: (drive: ScheduleDrive, kind: "decline" | "cancel") => void;
}) {
  const t = useTranslations("org.testDrives");
  const fmt = useFormatters();
  const text = useDriveText();
  const isToday = day.date === now.date;
  const booked = day.drives.filter((drive) => drive.status !== "CANCELLED");
  // Today, free time that has already gone by is not free: gaps end at now.
  const gaps = isToday
    ? day.gaps
        .filter((gap) => gap.endTime > now.time)
        .map((gap) => (gap.startTime < now.time ? { ...gap, startTime: now.time, minutes: minutesOf(gap.endTime) - minutesOf(now.time) } : gap))
    : day.gaps;
  const freeMinutes = gaps.reduce((sum, gap) => sum + gap.minutes, 0);

  const entries: Entry[] = [
    ...day.drives.map((drive) => ({ kind: "drive" as const, at: drive.startTime, drive })),
    ...gaps.map((gap) => ({ kind: "free" as const, at: gap.startTime, endTime: gap.endTime, minutes: gap.minutes })),
    ...(isToday && day.hours && now.time >= day.hours.openTime && now.time < day.hours.closeTime ? [{ kind: "now" as const, at: now.time }] : []),
  ].sort((a, b) => a.at.localeCompare(b.at) || (a.kind === "now" ? -1 : b.kind === "now" ? 1 : 0));

  return (
    <section aria-labelledby="day-title" className="flex flex-col gap-3 rounded-sheet border border-border bg-card p-4 sm:p-6">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="day-title" className="text-h2 font-extrabold leading-tight">
          {isToday ? t("day.today", { date: text.day(day.date) }) : text.day(day.date, true)}
        </h2>
        <p className="text-caption text-muted-foreground">
          {day.hours ? (
            <>
              {t("day.hours", { open: text.time(day.hours.openTime), close: text.time(day.hours.closeTime) })}{" "}
              {t("day.summary", { count: booked.length, value: fmt.number(booked.length), free: text.duration(freeMinutes) })}
            </>
          ) : null}
        </p>
      </div>

      {!day.hours && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-muted/60 px-4 py-3 text-caption">
          <span className="flex items-center gap-2">
            <CalendarX2 aria-hidden className="size-4 text-muted-foreground" />
            {day.drives.length === 0 ? t("day.closed") : t("day.noHours")}
          </span>
          <Link href={`${base}/settings`} className="font-semibold text-[#1d4e9e] hover:underline">
            {t("day.setHours")}
          </Link>
        </div>
      )}

      {day.drives.length === 0 && day.hours && day.gaps.length <= 1 && (
        <p className="text-caption text-muted-foreground">{t("day.empty")}</p>
      )}

      <ol className="flex flex-col gap-2.5">
        {entries.map((entry) => (
          <Fragment key={`${entry.kind}-${entry.at}-${entry.kind === "drive" ? entry.drive.id : ""}`}>
            {entry.kind === "now" ? (
              <li aria-label={t("day.now", { time: text.time(entry.at) })} className="flex items-center gap-3 py-1">
                <span className="shrink-0 rounded-full border-2 border-border-strong bg-marker px-2.5 text-micro font-bold">
                  {t("day.now", { time: text.time(entry.at) })}
                </span>
                <span aria-hidden className="h-1 flex-1 rounded-full bg-[repeating-linear-gradient(to_right,var(--marker)_0_18px,var(--inverse)_18px_28px)] rtl:bg-[repeating-linear-gradient(to_left,var(--marker)_0_18px,var(--inverse)_18px_28px)]" />
              </li>
            ) : entry.kind === "free" ? (
              <li className="grid grid-cols-1 gap-1 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4">
                <TimeSpan start={entry.at} end={entry.endTime} className="text-muted-foreground sm:pt-1.5" />
                <span className="rounded-control border-2 border-dashed border-border px-4 py-2 text-caption text-muted-foreground">
                  {t("day.free", { duration: text.duration(entry.minutes) })}
                </span>
              </li>
            ) : (
              <DriveCard
                drive={entry.drive}
                over={isOver(entry.drive, now)}
                base={base}
                busy={pendingId === entry.drive.id}
                onChange={onChange}
                onAskCancel={onAskCancel}
              />
            )}
          </Fragment>
        ))}
      </ol>
    </section>
  );
}

/** One booking: its time, the buyer and car, where it stands, and the one or two things to do next. */
function DriveCard({
  drive,
  over,
  base,
  busy,
  onChange,
  onAskCancel,
}: {
  drive: ScheduleDrive;
  over: boolean;
  base: string;
  busy: boolean;
  onChange: (id: string, change: DriveChange) => void;
  onAskCancel: (drive: ScheduleDrive, kind: "decline" | "cancel") => void;
}) {
  const t = useTranslations("org.testDrives");
  const text = useDriveText();
  const state = driveState(drive, over);

  return (
    <li aria-busy={busy || undefined} className={cn("grid grid-cols-1 gap-1 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4", busy && "opacity-60")}>
      <TimeSpan start={drive.startTime} end={drive.endTime} className="sm:pt-3" strong />
      <div className={cn("flex flex-col gap-3 rounded-control border border-border border-s-[5px] bg-field p-3 sm:flex-row sm:items-center sm:gap-4", EDGE[state])}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <CarThumb src={drive.car.image} className="h-11 w-16" />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <span className={cn("text-body font-semibold", state === "cancelled" && "line-through")}>{text.buyer(drive)}</span>
              <DriveStatusPill state={state} />
            </p>
            <Link href={`${base}/cars/${drive.car.id}/edit`} dir="auto" className="block truncate text-caption text-[#1d4e9e] hover:underline">
              {text.car(drive)}
            </Link>
            {drive.notes && (
              <p className="mt-1 text-caption text-muted-foreground">
                <span className="sr-only">{t("day.note")}: </span>
                <q dir="auto">{drive.notes}</q>
              </p>
            )}
          </div>
        </div>

        {(state === "pending" || state === "outcome" || state === "upcoming") && (
          <div className="flex shrink-0 gap-2">
            {state === "pending" && (
              <>
                <Button variant="inverse" size="control" className="h-10 flex-1 sm:flex-none" disabled={busy} onClick={() => onChange(drive.id, { status: "CONFIRMED", toast: "CONFIRMED" })}>
                  {t("actions.confirm")}
                </Button>
                <Button variant="outline-strong" size="control" className="h-10 flex-1 border bg-field sm:flex-none" disabled={busy} onClick={() => onAskCancel(drive, "decline")}>
                  {t("actions.decline")}
                </Button>
              </>
            )}
            {state === "outcome" && (
              <>
                <Button variant="inverse" size="control" className="h-10 flex-1 sm:flex-none" disabled={busy} onClick={() => onChange(drive.id, { status: "COMPLETED", toast: "COMPLETED" })}>
                  {t("actions.complete")}
                </Button>
                <Button variant="outline-strong" size="control" className="h-10 flex-1 border bg-field sm:flex-none" disabled={busy} onClick={() => onChange(drive.id, { status: "CANCELLED", toast: "noShow" })}>
                  {t("actions.didntCome")}
                </Button>
              </>
            )}
            {state === "upcoming" && (
              <Button variant="outline-strong" size="control" className="h-10 flex-1 border bg-field text-destructive sm:flex-none" disabled={busy} onClick={() => onAskCancel(drive, "cancel")}>
                {t("actions.cancel")}
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/** A slot's time: one line on a phone, the start over "to …" beside the card on wider screens. */
function TimeSpan({ start, end, strong, className }: { start: string; end: string; strong?: boolean; className?: string }) {
  const t = useTranslations("org.testDrives");
  const text = useDriveText();
  return (
    <span className={cn("text-caption sm:text-end", className)}>
      <span className="sm:hidden">{text.range(start, end)}</span>
      <span className="hidden sm:block">
        <span className={cn("block whitespace-nowrap", strong && "font-semibold")}>{text.time(start)}</span>
        <span className="block whitespace-nowrap text-muted-foreground">{t("until", { end: text.time(end) })}</span>
      </span>
    </span>
  );
}
