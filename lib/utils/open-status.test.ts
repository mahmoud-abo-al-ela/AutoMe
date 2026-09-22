import { describe, it, expect } from "vitest";
import { getOpenStatus, parseTimeToMinutes } from "./open-status";
import type { WorkingHoursEntry } from "./working-hours";
import type { DayOfWeek } from "@/lib/generated/prisma";

const day = (
  dayKey: DayOfWeek,
  openTime: string,
  closeTime: string,
  isOpen = true
): WorkingHoursEntry => ({
  dayKey,
  openTime,
  closeTime,
  isOpen,
});

// 2026-01-15 is a Thursday; 2026-07-15 a Wednesday. January is EET (+02:00),
// July is EEST (+03:00) — Egypt reinstated DST in 2023, so both are exercised.
const OPEN_ALL_WEEK: WorkingHoursEntry[] = [
  day("SUNDAY", "09:00", "17:00"),
  day("MONDAY", "09:00", "17:00"),
  day("TUESDAY", "09:00", "17:00"),
  day("WEDNESDAY", "09:00", "17:00"),
  day("THURSDAY", "09:00", "17:00"),
  day("FRIDAY", "09:00", "17:00", false),
  day("SATURDAY", "09:00", "17:00", false),
];

describe("parseTimeToMinutes", () => {
  it("reads 24-hour times", () => {
    expect(parseTimeToMinutes("09:00")).toBe(540);
    expect(parseTimeToMinutes("00:00")).toBe(0);
    expect(parseTimeToMinutes("23:59")).toBe(1439);
  });

  it("reads 12-hour times, including the midnight and noon edge cases", () => {
    expect(parseTimeToMinutes("9:00 AM")).toBe(540);
    expect(parseTimeToMinutes("12:00 AM")).toBe(0);
    expect(parseTimeToMinutes("12:00 PM")).toBe(720);
    expect(parseTimeToMinutes("5:30 PM")).toBe(1050);
  });

  it("rejects what it cannot parse rather than guessing", () => {
    expect(parseTimeToMinutes(null)).toBeNull();
    expect(parseTimeToMinutes("")).toBeNull();
    expect(parseTimeToMinutes("closed")).toBeNull();
    expect(parseTimeToMinutes("25:00")).toBeNull();
    expect(parseTimeToMinutes("09:70")).toBeNull();
  });
});

describe("getOpenStatus", () => {
  it("reports unavailable when there are no hours", () => {
    expect(getOpenStatus(null).statusKey).toBe("unavailable");
    expect(getOpenStatus([]).statusKey).toBe("unavailable");
  });

  it("is open during business hours, and says when it closes", () => {
    // 12:00 Cairo on a Thursday (EET, so 10:00Z).
    const now = new Date("2026-01-15T10:00:00Z");

    expect(getOpenStatus(OPEN_ALL_WEEK, now)).toEqual({
      isOpen: true,
      statusKey: "closesAt",
      params: { time: "17:00" },
    });
  });

  it("says when it opens, before opening time on an open day", () => {
    // 07:00 Cairo.
    const now = new Date("2026-01-15T05:00:00Z");

    expect(getOpenStatus(OPEN_ALL_WEEK, now)).toEqual({
      isOpen: false,
      statusKey: "opensAt",
      params: { time: "09:00" },
    });
  });

  it("rolls to tomorrow after closing time", () => {
    // 18:00 Cairo on Wednesday — Thursday is open.
    const now = new Date("2026-07-15T15:00:00Z");

    expect(getOpenStatus(OPEN_ALL_WEEK, now)).toEqual({
      isOpen: false,
      statusKey: "opensTomorrowAt",
      params: { time: "09:00", day: "THURSDAY" },
    });
  });

  it("names the day when the next opening is not tomorrow", () => {
    // 18:00 Cairo Thursday: Friday and Saturday are shut, so it is Sunday.
    const now = new Date("2026-01-15T16:00:00Z");

    expect(getOpenStatus(OPEN_ALL_WEEK, now)).toEqual({
      isOpen: false,
      statusKey: "opensOnDayAt",
      params: { time: "09:00", day: "SUNDAY" },
    });
  });

  it("looks ahead from a closed day too", () => {
    // Friday, a closed day.
    const now = new Date("2026-01-16T10:00:00Z");

    expect(getOpenStatus(OPEN_ALL_WEEK, now)).toEqual({
      isOpen: false,
      statusKey: "opensOnDayAt",
      params: { time: "09:00", day: "SUNDAY" },
    });
  });

  it("reports closed when no day is open", () => {
    const neverOpen = OPEN_ALL_WEEK.map((entry) => ({
      ...entry,
      isOpen: false,
    }));

    expect(getOpenStatus(neverOpen, new Date("2026-01-15T10:00:00Z"))).toEqual({
      isOpen: false,
      statusKey: "closed",
    });
  });

  it("reports unavailable when an open day has unparseable times", () => {
    const broken = [day("THURSDAY", "whenever", "later")];

    expect(getOpenStatus(broken, new Date("2026-01-15T10:00:00Z"))).toEqual({
      isOpen: false,
      statusKey: "unavailable",
    });
  });

  // The bug this module was extracted to fix: the status used to be computed
  // from the visitor's own clock, so the same dealership at the same instant
  // read differently depending on where the reader was sitting.
  describe("resolves the clock in Cairo, not in the visitor's zone", () => {
    it("is open at 09:30 Cairo even when it is 07:30 for the reader", () => {
      // 07:30Z — before opening in UTC/London, 09:30 in Cairo.
      const now = new Date("2026-01-15T07:30:00Z");

      expect(getOpenStatus(OPEN_ALL_WEEK, now).isOpen).toBe(true);
    });

    it("is shut at 17:30 Cairo even when it is 15:30 for the reader", () => {
      const now = new Date("2026-01-15T15:30:00Z");

      expect(getOpenStatus(OPEN_ALL_WEEK, now).isOpen).toBe(false);
    });

    it("uses the Cairo date when the two zones disagree about the day", () => {
      // 22:30Z Wednesday is already 00:30 Thursday in Cairo (EEST). The day
      // lookup has to land on Thursday, and it is before opening.
      const now = new Date("2026-07-15T22:30:00Z");

      expect(getOpenStatus(OPEN_ALL_WEEK, now)).toEqual({
        isOpen: false,
        statusKey: "opensAt",
        params: { time: "09:00" },
      });
    });
  });
});
