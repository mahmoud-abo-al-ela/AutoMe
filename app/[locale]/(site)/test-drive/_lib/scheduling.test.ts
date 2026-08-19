import { describe, it, expect } from "vitest";
import {
  dayOfWeekFor,
  generateAvailableDates,
  generateTimeSlots,
  makeIsDateDisabled,
  toWorkingHours,
  type WorkingHours,
} from "./scheduling";
import type { WorkingHoursEntry } from "@/lib/utils/working-hours";

const entry = (
  dayKey: WorkingHoursEntry["dayKey"],
  openTime: string,
  closeTime: string,
  isOpen = true,
): WorkingHoursEntry => ({
  day: dayKey,
  dayKey,
  openTime,
  closeTime,
  isOpen,
});

describe("dayOfWeekFor", () => {
  // The stored hours are keyed Mon-first but Date.getDay() is Sunday-first.
  // Getting this backwards offers every booking against the wrong day's hours,
  // silently and consistently.
  it("maps a date to the day the dealership stores its hours under", () => {
    expect(dayOfWeekFor(new Date("2026-08-16T12:00:00"))).toBe("SUNDAY");
    expect(dayOfWeekFor(new Date("2026-08-17T12:00:00"))).toBe("MONDAY");
    expect(dayOfWeekFor(new Date("2026-08-22T12:00:00"))).toBe("SATURDAY");
  });
});

describe("toWorkingHours", () => {
  it("fills in days the dealership never configured as closed", () => {
    const hours = toWorkingHours([entry("MONDAY", "09:00", "17:00")]);

    expect(hours.MONDAY).toEqual({
      isOpen: true,
      openTime: "09:00",
      closeTime: "17:00",
    });
    // The dealership listed only Monday. Every other day must come back closed
    // rather than absent — an absent day would be offered for booking.
    expect(hours.TUESDAY.isOpen).toBe(false);
    expect(hours.SUNDAY.isOpen).toBe(false);
  });

  it("keeps a configured-but-closed day closed", () => {
    const hours = toWorkingHours([entry("FRIDAY", "09:00", "17:00", false)]);
    expect(hours.FRIDAY.isOpen).toBe(false);
  });
});

describe("generateAvailableDates", () => {
  it("offers only days the dealership is open", () => {
    const closed = (): WorkingHours["MONDAY"] => ({
      isOpen: false,
      openTime: "",
      closeTime: "",
    });
    const hours = toWorkingHours([entry("MONDAY", "09:00", "17:00")]);
    expect(hours.TUESDAY).toEqual(closed());

    const dates = generateAvailableDates(hours, 14);

    expect(dates.length).toBeGreaterThan(0);
    expect(dates.every((d) => dayOfWeekFor(d) === "MONDAY")).toBe(true);
  });

  it("offers nothing when the dealership is closed all week", () => {
    expect(generateAvailableDates(toWorkingHours([]), 14)).toEqual([]);
  });
});

describe("makeIsDateDisabled", () => {
  const hours = toWorkingHours([entry("MONDAY", "09:00", "17:00")]);
  const isDisabled = makeIsDateDisabled(hours);

  it("disables a day the dealership is closed", () => {
    const nextTuesday = new Date();
    nextTuesday.setDate(nextTuesday.getDate() + ((2 - nextTuesday.getDay() + 7) % 7 || 7));
    expect(isDisabled(nextTuesday)).toBe(true);
  });

  it("disables dates in the past even on an open day", () => {
    const lastMonday = new Date();
    lastMonday.setDate(lastMonday.getDate() - 7 - ((lastMonday.getDay() + 6) % 7));
    expect(isDisabled(lastMonday)).toBe(true);
  });
});

describe("generateTimeSlots", () => {
  it("emits half-hour slots and excludes the closing time", () => {
    expect(generateTimeSlots("09:00", "11:00")).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
    ]);
  });

  it("emits nothing for a closed day's empty times", () => {
    // toWorkingHours writes "" for days with no configured hours, and the edit
    // form calls this before the real hours land.
    expect(generateTimeSlots("", "")).toEqual([]);
  });
});
