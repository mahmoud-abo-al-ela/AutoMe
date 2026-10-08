import { describe, expect, it } from "vitest";
import { monthlyIncome, periodWindows, runningTotals } from "./overview";
import { parseOverviewPeriod } from "./overview-options";

describe("super-admin overview", () => {
  it("counts a yearly plan as a twelfth of its price", () => {
    expect(
      monthlyIncome([
        { billingPeriod: "MONTHLY", plan: { monthlyPrice: 80000, yearlyPrice: 800000 } },
        { billingPeriod: "YEARLY", plan: { monthlyPrice: 150000, yearlyPrice: 1500000 } },
      ]),
    ).toBe(80000 + 125000);
  });

  it("takes only the periods it offers from the URL", () => {
    expect(parseOverviewPeriod("7")).toBe(7);
    expect(parseOverviewPeriod("365")).toBe(365);
    expect(parseOverviewPeriod("14")).toBe(30);
    expect(parseOverviewPeriod(undefined)).toBe(30);
  });

  it("ends the period today and puts the previous one right before it", () => {
    expect(periodWindows("2026-10-08", 7)).toEqual({
      current: { start: "2026-10-02", end: "2026-10-08" },
      previous: { start: "2026-09-25", end: "2026-10-01" },
    });
  });

  it("adds up day by day, leaving out what falls outside the days", () => {
    const events = [
      { date: "2026-09-30", value: 5 }, // the day before
      { date: "2026-10-01", value: 2 },
      { date: "2026-10-03", value: 1 },
      { date: "2026-10-03", value: 4 },
      { date: "2026-10-04", value: 9 }, // the day after
    ];
    expect(runningTotals(events, "2026-10-01", 3)).toEqual([2, 2, 7]);
  });
});
