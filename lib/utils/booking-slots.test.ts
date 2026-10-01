import { describe, it, expect } from "vitest";
import {
  bookingWindow,
  checkBooking,
  dayOfWeekForDate,
  endTimeOptions,
  isDateString,
  utcToDateOnly,
  type DayHours,
} from "@/lib/utils/booking-slots";

// Thursday 1 October 2026, 11:00 in Cairo (UTC+3 under Egypt's summer time).
const NOW = new Date("2026-10-01T08:00:00Z");
const OPEN: DayHours = { isOpen: true, openTime: "09:00", closeTime: "17:00" };
const CLOSED: DayHours = { isOpen: false, openTime: "", closeTime: "" };

const book = (date: string, startTime: string, endTime: string, booked = [] as { startTime: string; endTime: string }[], hours: DayHours = OPEN) =>
  checkBooking({ date, startTime, endTime }, hours, booked, NOW);

describe("dates", () => {
  it("takes the weekday from the date itself, not the runtime's zone", () => {
    expect(dayOfWeekForDate("2026-10-01")).toBe("THURSDAY");
    expect(dayOfWeekForDate("2026-10-02")).toBe("FRIDAY");
    expect(dayOfWeekForDate("2026-10-03")).toBe("SATURDAY");
  });

  it("rejects dates that do not exist", () => {
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("2026-10-1")).toBe(false);
    expect(isDateString("2026-10-01")).toBe(true);
  });

  it("reads a stored @db.Date back as the same calendar day", () => {
    expect(utcToDateOnly("2026-10-05T00:00:00.000Z")).toBe("2026-10-05");
    expect(utcToDateOnly(new Date("2026-10-05T00:00:00.000Z"))).toBe("2026-10-05");
  });

  it("starts the booking window on Cairo's today, not UTC's", () => {
    // 21:30 UTC on the 1st is already 00:30 on the 2nd in Cairo.
    expect(bookingWindow(new Date("2026-10-01T21:30:00Z")).first).toBe("2026-10-02");
    expect(bookingWindow(NOW)).toEqual({ first: "2026-10-01", last: "2026-10-14" });
  });
});

describe("checkBooking", () => {
  it("accepts a free slot inside working hours", () => {
    expect(book("2026-10-03", "10:00", "11:00")).toBeNull();
  });

  it("refuses malformed or backwards times", () => {
    expect(book("2026-10-03", "25:00", "26:00")).toBe("invalid");
    expect(book("2026-10-03", "11:00", "10:00")).toBe("invalid");
    expect(book("not-a-date", "10:00", "11:00")).toBe("invalid");
  });

  it("refuses yesterday and anything past the horizon", () => {
    expect(book("2026-09-30", "10:00", "11:00")).toBe("outsideWindow");
    expect(book("2026-10-14", "10:00", "11:00")).toBeNull();
    expect(book("2026-10-15", "10:00", "11:00")).toBe("outsideWindow");
  });

  it("refuses a day the dealership is closed", () => {
    expect(book("2026-10-02", "10:00", "11:00", [], CLOSED)).toBe("closed");
  });

  it("refuses times outside working hours", () => {
    expect(book("2026-10-03", "08:30", "09:30")).toBe("outsideHours");
    expect(book("2026-10-03", "16:30", "17:30")).toBe("outsideHours");
  });

  it("refuses times off the half-hour grid, but allows ending at closing", () => {
    expect(book("2026-10-03", "10:15", "11:00")).toBe("offGrid");
    const lateClose: DayHours = { isOpen: true, openTime: "09:00", closeTime: "17:15" };
    expect(book("2026-10-03", "16:30", "17:15", [], lateClose)).toBeNull();
  });

  it("refuses a slot whose start has passed today, in Cairo time", () => {
    expect(book("2026-10-01", "10:30", "11:30")).toBe("past");
    expect(book("2026-10-01", "11:00", "11:30")).toBe("past");
    expect(book("2026-10-01", "11:30", "12:00")).toBeNull();
  });

  it("refuses any overlap with an existing booking, but not touching ones", () => {
    const booked = [{ startTime: "11:00", endTime: "12:00" }];
    expect(book("2026-10-03", "10:30", "11:30", booked)).toBe("taken");
    expect(book("2026-10-03", "11:30", "12:30", booked)).toBe("taken");
    expect(book("2026-10-03", "10:00", "13:00", booked)).toBe("taken");
    expect(book("2026-10-03", "10:00", "11:00", booked)).toBeNull();
    expect(book("2026-10-03", "12:00", "13:00", booked)).toBeNull();
  });
});

describe("endTimeOptions", () => {
  it("offers every half hour up to closing", () => {
    expect(endTimeOptions("15:30", OPEN, [])).toEqual(["16:00", "16:30", "17:00"]);
  });

  it("stops at the next booking instead of spanning it", () => {
    const booked = [{ startTime: "11:00", endTime: "12:00" }];
    expect(endTimeOptions("10:00", OPEN, booked)).toEqual(["10:30", "11:00"]);
  });

  it("ends exactly at an off-grid closing time", () => {
    const lateClose: DayHours = { isOpen: true, openTime: "09:00", closeTime: "17:15" };
    expect(endTimeOptions("16:00", lateClose, [])).toEqual(["16:30", "17:00", "17:15"]);
  });

  it("offers nothing on a closed day", () => {
    expect(endTimeOptions("10:00", CLOSED, [])).toEqual([]);
  });
});
