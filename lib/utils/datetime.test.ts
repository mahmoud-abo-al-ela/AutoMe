import { describe, expect, it } from "vitest";
import {
  dayPeriodLabels,
  dayPeriodOf,
  flipDayPeriod,
  formatClockTime,
  formatDate,
  formatDateTime,
  formatTime,
} from "./datetime";
import { formatCarPrice } from "./currency";
import { formatMileage } from "./units";
import { formatNumber } from "./number";

/**
 * These pin the two rules that are invisible until they are wrong: Arabic
 * renders Eastern Arabic numerals across every formatter, and times must be
 * expressed in Africa/Cairo rather than in whatever zone the server happens to
 * run in.
 *
 * The numeral direction was reversed on 2026-08-26 — these previously asserted
 * Western digits. What matters either way is that all five formatters agree;
 * a product where the price is ١٥٠٠٠٠٠ and the mileage is 85,000 is worse than
 * either choice made consistently.
 */

const EASTERN_ARABIC = /[٠-٩]/;
const WESTERN = /[0-9]/;

describe("Eastern Arabic numerals in Arabic", () => {
  const cases: Array<[string, string]> = [
    ["formatDate", formatDate("2026-08-15T10:00:00Z", "ar")],
    ["formatTime", formatTime("2026-08-15T10:00:00Z", "ar")],
    ["formatDateTime", formatDateTime("2026-08-15T10:00:00Z", "ar")],
    ["formatCarPrice", formatCarPrice(1500000, "ar")],
    ["formatMileage", formatMileage(85000, "ar")],
    ["formatNumber", formatNumber(1234, "ar")],
  ];

  for (const [name, output] of cases) {
    it(`${name} emits Eastern Arabic numerals`, () => {
      expect(output).toMatch(EASTERN_ARABIC);
      expect(output).not.toMatch(WESTERN);
    });
  }

  it("still renders Arabic script for the words", () => {
    // If this fails the locale silently fell back to English, which the digit
    // assertions above would not catch on their own.
    expect(formatDate("2026-08-15T10:00:00Z", "ar")).toMatch(/[؀-ۿ]/);
  });
});

describe("Western digits in English", () => {
  const cases: Array<[string, string]> = [
    ["formatDate", formatDate("2026-08-15T10:00:00Z", "en")],
    ["formatCarPrice", formatCarPrice(1500000, "en")],
    ["formatMileage", formatMileage(85000, "en")],
    ["formatNumber", formatNumber(1234, "en")],
  ];

  for (const [name, output] of cases) {
    it(`${name} is unaffected by the Arabic numbering system`, () => {
      expect(output).toMatch(WESTERN);
      expect(output).not.toMatch(EASTERN_ARABIC);
    });
  }
});

describe("Africa/Cairo", () => {
  it("formats an instant in Cairo time, not UTC", () => {
    // 22:30 UTC on 15 Aug is 00:30 on 16 Aug in Cairo (UTC+2, DST in effect).
    // Formatting in UTC would report the 15th.
    expect(formatDate("2026-08-15T22:30:00Z", "en")).toContain("16");
  });

  it("tracks the DST transition rather than assuming a fixed +02:00", () => {
    // Egypt reinstated DST in 2023. Late January is UTC+2; August is UTC+3.
    // A hardcoded offset would render one of these an hour off.
    const winter = formatTime("2026-01-15T12:00:00Z", "en");
    const summer = formatTime("2026-08-15T12:00:00Z", "en");
    expect(winter).not.toEqual(summer);
  });
});

describe("invalid input", () => {
  it("returns an empty string rather than 'Invalid Date'", () => {
    expect(formatDate("not-a-date", "en")).toBe("");
    expect(formatTime("", "en")).toBe("");
    expect(formatDateTime("nope", "ar")).toBe("");
  });
});

describe("formatClockTime", () => {
  // These are bare "HH:mm" columns — a clock face with no date and no zone.

  it("localizes the digits and the meridiem in Arabic", () => {
    const output = formatClockTime("09:00", "ar");
    expect(output).toMatch(EASTERN_ARABIC);
    expect(output).not.toMatch(WESTERN);
    // Arabic script, so it is a real translation rather than a fallback.
    expect(output).toMatch(/[؀-ۿ]/);
  });

  it("keeps Western digits in English", () => {
    const output = formatClockTime("09:00", "en");
    expect(output).toMatch(WESTERN);
    expect(output).not.toMatch(EASTERN_ARABIC);
  });

  it("does not shift the hour by the Cairo offset", () => {
    // The whole point of formatting these in UTC: 09:00 is what the dealership
    // typed, not an instant to be converted. Running it through Africa/Cairo
    // would display 11:00 or 12:00 depending on the time of year.
    expect(formatClockTime("09:00", "en")).toContain("9:00");
    expect(formatClockTime("17:30", "en")).toContain("5:30");
  });

  it("returns malformed input unchanged rather than Invalid Date", () => {
    for (const bad of ["", "not a time", "25:00", "09:70", "9"]) {
      expect(formatClockTime(bad, "ar")).toBe(bad);
    }
  });
});

/**
 * The AM/PM marker beside an Arabic time input. A native `<input type="time">`
 * renders its own from the *browser's* UI language and ignores the page's —
 * `lang="ar"`, `lang="ar-EG"` and `lang="ar-EG-u-nu-latn"` were all tried, and
 * Chromium rendered "04:00 PM" for every one — so the marker is hidden and
 * replaced. These pin the replacement.
 */
describe("dayPeriodLabels", () => {
  it("gives Arabic its own markers", () => {
    expect(dayPeriodLabels("ar")).toEqual({ am: "ص", pm: "م" });
  });

  it("gives English the ones it expects", () => {
    expect(dayPeriodLabels("en")).toEqual({ am: "AM", pm: "PM" });
  });

  it("agrees with how a time is formatted for reading", () => {
    // The chip beside the input and the marker on a dealership page must
    // match, or the same 4pm reads two ways in one product.
    expect(formatClockTime("16:00", "ar")).toContain(dayPeriodLabels("ar").pm);
    expect(formatClockTime("09:00", "ar")).toContain(dayPeriodLabels("ar").am);
  });
});

describe("dayPeriodOf", () => {
  it.each([
    ["00:00", "am"],
    ["09:30", "am"],
    ["11:59", "am"],
    ["12:00", "pm"],
    ["16:00", "pm"],
    ["23:59", "pm"],
  ])("puts %s in the right half of the day", (value, expected) => {
    expect(dayPeriodOf(value)).toBe(expected);
  });

  it("is null for anything that is not a clock string", () => {
    for (const bad of ["", "not a time", "25:00", "09:70", "9"]) {
      expect(dayPeriodOf(bad)).toBeNull();
    }
  });
});

describe("flipDayPeriod", () => {
  it("moves a time to the other half of the day", () => {
    expect(flipDayPeriod("09:00")).toBe("21:00");
    expect(flipDayPeriod("21:00")).toBe("09:00");
    expect(flipDayPeriod("16:30")).toBe("04:30");
  });

  it("wraps midnight and noon rather than running past 23", () => {
    expect(flipDayPeriod("00:00")).toBe("12:00");
    expect(flipDayPeriod("12:00")).toBe("00:00");
    expect(flipDayPeriod("23:45")).toBe("11:45");
  });

  it("returns to where it started when pressed twice", () => {
    for (let hours = 0; hours < 24; hours += 1) {
      const value = `${String(hours).padStart(2, "0")}:15`;
      expect(flipDayPeriod(flipDayPeriod(value))).toBe(value);
    }
  });

  it("leaves malformed input alone rather than inventing a time", () => {
    for (const bad of ["", "not a time", "25:00"]) {
      expect(flipDayPeriod(bad)).toBe(bad);
    }
  });
});
