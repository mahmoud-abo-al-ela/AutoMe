import { describe, expect, it } from "vitest";
import { analyticsQueryString, changeFrom, median, parseAnalyticsQuery } from "./analytics-options";

describe("analytics query", () => {
  it("opens the marketplace for 30 days by default", () => {
    expect(parseAnalyticsQuery({})).toEqual({ report: "marketplace", days: 30 });
    expect(parseAnalyticsQuery({ report: "revenue", days: "14" })).toEqual({ report: "marketplace", days: 30 });
  });

  it("reads back what it writes, and leaves defaults out", () => {
    expect(analyticsQueryString({ report: "marketplace", days: 30 })).toBe("");
    const query = { report: "ai", days: 365 } as const;
    expect(parseAnalyticsQuery(Object.fromEntries(new URLSearchParams(analyticsQueryString(query))))).toEqual(query);
  });
});

describe("changeFrom", () => {
  it("is the share it moved by, or null with nothing before", () => {
    expect(changeFrom(10, 15)).toBe(0.5);
    expect(changeFrom(20, 15)).toBe(-0.25);
    expect(changeFrom(0, 4)).toBeNull();
  });
});

describe("median", () => {
  it("takes the middle value, or the mean of the middle two", () => {
    expect(median([9, 1, 5])).toBe(5);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});
