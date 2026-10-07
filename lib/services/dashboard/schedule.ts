// The Test drives calendar (canvas: Test drives — calendar round 2, C · Month and day).
import * as scheduleRepository from "@/lib/repositories/dashboard/schedule";
import { cairoNow } from "@/lib/utils/datetime";
import { dayOfWeekForDate } from "@/lib/utils/booking-slots";
import type { DayOfWeek } from "@/lib/generated/prisma";
import { verifyAccess } from "./access";

const ALL_DAYS: DayOfWeek[] = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

/** A YYYY-MM-DD calendar date as the UTC midnight TestDrive.date (@db.Date) compares with. */
const dateOnly = (date: string) => new Date(`${date}T00:00:00.000Z`);
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const fromMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

type HoursRow = Awaited<ReturnType<typeof scheduleRepository.findWorkingHours>>[number];

/** A weekday's hours, or null when the dealership is closed that day (or never said). */
function hoursOn(rows: HoursRow[], weekday: DayOfWeek) {
  const row = rows.find((candidate) => candidate.dayOfWeek.includes(weekday));
  return row?.isOpen ? { openTime: row.openTime, closeTime: row.closeTime } : null;
}

/**
 * The open time a day has left between its bookings, within opening hours.
 * Bookings may overlap or run past closing; each is clipped to the day and the
 * gaps between them returned in order. Pure, so the calendar's "Free, 2½
 * hours" can be tested without a database.
 */
export function freeGaps(
  hours: { openTime: string; closeTime: string } | null,
  bookings: { startTime: string; endTime: string }[],
): { startTime: string; endTime: string; minutes: number }[] {
  if (!hours) return [];
  const open = toMinutes(hours.openTime);
  const close = toMinutes(hours.closeTime);
  const busy = bookings
    .map((booking) => [Math.max(open, toMinutes(booking.startTime)), Math.min(close, toMinutes(booking.endTime))] as const)
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  const gaps: { startTime: string; endTime: string; minutes: number }[] = [];
  let cursor = open;
  for (const [start, end] of busy) {
    if (start > cursor) gaps.push({ startTime: fromMinutes(cursor), endTime: fromMinutes(start), minutes: start - cursor });
    cursor = Math.max(cursor, end);
  }
  if (close > cursor) gaps.push({ startTime: fromMinutes(cursor), endTime: fromMinutes(close), minutes: close - cursor });
  return gaps;
}

/** Whether a booking's time is over, judged on Cairo's clock. */
const isOver = (date: string, endTime: string, now: { date: string; time: string }) =>
  date < now.date || (date === now.date && endTime <= now.time);

type DriveRow = Awaited<ReturnType<typeof scheduleRepository.findDrivesOn>>[number];

function toDrive(drive: DriveRow, now: { date: string; time: string }) {
  const date = dayKey(drive.date);
  return {
    id: drive.id,
    date,
    startTime: drive.startTime,
    endTime: drive.endTime,
    status: drive.status,
    notes: drive.notes,
    createdAt: drive.createdAt,
    buyer: drive.user?.name ?? null,
    car: {
      id: drive.car.id,
      make: drive.car.make,
      model: drive.car.model,
      year: drive.car.year,
      title: drive.car.title,
      titleEn: drive.car.titleEn,
      titleAr: drive.car.titleAr,
      image: drive.car.images[0] ?? null,
    },
    /** Its time has passed: a confirmed one now needs an outcome. */
    over: isOver(date, drive.endTime, now),
  };
}

export type ScheduleDrive = ReturnType<typeof toDrive>;

/**
 * A month for the calendar: per day, how many drives and whether one still
 * needs an outcome; and the weekdays the dealership is closed, which the
 * calendar mutes.
 */
export async function getScheduleMonth(userId: string, organizationId: string, month: string) {
  await verifyAccess(userId, organizationId);
  const [year, monthIndex] = month.split("-").map(Number);
  const from = new Date(Date.UTC(year, monthIndex - 1, 1));
  const to = new Date(Date.UTC(year, monthIndex, 0));
  const now = cairoNow();

  const [drives, hours] = await Promise.all([
    scheduleRepository.findDrivesBetween(organizationId, from, to),
    scheduleRepository.findWorkingHours(organizationId),
  ]);

  const days: Record<string, { drives: number; needsOutcome: boolean }> = {};
  for (const drive of drives) {
    const key = dayKey(drive.date);
    const day = (days[key] ??= { drives: 0, needsOutcome: false });
    day.drives += 1;
    if (drive.status === "CONFIRMED" && isOver(key, drive.endTime, now)) day.needsOutcome = true;
  }

  // With no hours set at all, nothing is muted: unknown is not closed.
  const closedWeekdays = hours.length === 0 ? [] : ALL_DAYS.filter((weekday) => !hoursOn(hours, weekday));
  return { month, today: now.date, days, closedWeekdays };
}

/** One day: its opening hours, its bookings, and the free time between them. */
export async function getScheduleDay(userId: string, organizationId: string, date: string) {
  await verifyAccess(userId, organizationId);
  const now = cairoNow();
  const [rows, hoursRows] = await Promise.all([
    scheduleRepository.findDrivesOn(organizationId, dateOnly(date)),
    scheduleRepository.findWorkingHours(organizationId),
  ]);
  const hours = hoursOn(hoursRows, dayOfWeekForDate(date));
  const drives = rows.map((row) => toDrive(row, now));

  return {
    date,
    today: now.date,
    now: now.time,
    hours,
    drives,
    gaps: freeGaps(
      hours,
      drives.filter((drive) => drive.status !== "CANCELLED"),
    ),
  };
}

export type ScheduleDay = Awaited<ReturnType<typeof getScheduleDay>>;

/** Every confirmed drive that has happened, or not, with no outcome recorded yet. */
export async function getDrivesNeedingOutcome(userId: string, organizationId: string) {
  await verifyAccess(userId, organizationId);
  const now = cairoNow();
  const rows = await scheduleRepository.findDrivesNeedingOutcome(organizationId, dateOnly(now.date), now.time);
  return rows.map((row) => toDrive(row, now));
}
