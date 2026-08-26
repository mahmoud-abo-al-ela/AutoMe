import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatTime } from "./datetime";
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
