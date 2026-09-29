/**
 * The week a weekly summary covers, in Cairo time: Saturday to Friday — the
 * Egyptian work week — sent on Saturday from 09:00 (owner's choice).
 *
 * Computed with the IANA zone, not a fixed +02:00: Egypt has daylight saving
 * time again (since 2023), so Cairo is UTC+3 in summer and UTC+2 in winter,
 * and 09:00 Cairo is 06:00 or 07:00 UTC. The cron runs at both; `due` is what
 * makes the early one wait in winter.
 */

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

/** Minutes Cairo is ahead of UTC at an instant. */
function cairoOffsetMinutes(instant: number): number {
  const w = cairoWall(new Date(instant));
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  return Math.round((asUtc - Math.floor(instant / 60_000) * 60_000) / 60_000);
}

/** The instant Cairo's clocks read 00:00 on a calendar day. */
function cairoMidnight(year: number, month: number, day: number): Date {
  const wallAsUtc = Date.UTC(year, month - 1, day);
  // The offset at the guess can differ from the offset at the answer on a
  // transition day; asking twice settles it.
  const first = wallAsUtc - cairoOffsetMinutes(wallAsUtc) * 60_000;
  return new Date(wallAsUtc - cairoOffsetMinutes(first) * 60_000);
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
  /**
   * Whether the summary may go out now: any time except Saturday before
   * 09:00 Cairo, when the week has only just ended. A run missed on Saturday
   * can still send the same week's summary later in the week.
   */
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

  const at = (d: Date) => cairoMidnight(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  return {
    start: at(lastSaturday),
    end: at(thisSaturday),
    weekStart: lastSaturday,
    key: lastSaturday.toISOString().slice(0, 10),
    due: !(sinceSaturday === 0 && wall.hour < 9),
  };
}
