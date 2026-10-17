import { cairoMidnight, utcToDateOnly } from "@/lib/utils/date-only";

const ZONE = "Africa/Cairo";
const DAY_MS = 86_400_000;

const FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CairoWall {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
}

function cairoWall(instant: Date): CairoWall {
  const parts = Object.fromEntries(FORMAT.formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

export interface DigestWeek {
  /** Saturday 00:00 Cairo, inclusive. */
  start: Date;
  /** The following Saturday 00:00 Cairo, exclusive. */
  end: Date;
  /** The start as a calendar date (UTC midnight), for the DigestSend ledger. */
  weekStart: Date;
  /** "2026-09-19": the start's Cairo date, for logs and subjects. */
  key: string;
  due: boolean;
}

/** The last complete Saturday–Friday week before `now`, in Cairo. */
export function digestWeek(now: Date): DigestWeek {
  const wall = cairoWall(now);
  const sinceSaturday = (wall.weekday + 1) % 7; // Saturday 0, Sunday 1, … Friday 6
  // Calendar arithmetic on a UTC-midnight date: no zone can shift a day here.
  const today = Date.UTC(wall.year, wall.month - 1, wall.day);
  const thisSaturday = new Date(today - sinceSaturday * DAY_MS);
  const lastSaturday = new Date(thisSaturday.getTime() - 7 * DAY_MS);

  const at = (d: Date) => cairoMidnight(utcToDateOnly(d));
  return {
    start: at(lastSaturday),
    end: at(thisSaturday),
    weekStart: lastSaturday,
    key: lastSaturday.toISOString().slice(0, 10),
    due: !(sinceSaturday === 0 && wall.hour < 9),
  };
}
