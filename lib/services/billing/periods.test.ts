import { describe, it, expect } from "vitest";
import {
  addPeriod,
  daysLeft,
  graceEndsOn,
  periodFrom,
  periodStartingToday,
  renewalPeriod,
  renewalStage,
  trialPeriod,
} from "@/lib/services/billing/periods";

describe("addPeriod", () => {
  it("adds one calendar month", () => {
    expect(addPeriod("2026-10-01", "MONTHLY")).toBe("2026-11-01");
    expect(addPeriod("2026-10-15", "MONTHLY")).toBe("2026-11-15");
  });

  it("crosses the year", () => {
    expect(addPeriod("2026-12-20", "MONTHLY")).toBe("2027-01-20");
  });

  it("clamps to the last day of a shorter month", () => {
    expect(addPeriod("2027-01-31", "MONTHLY")).toBe("2027-02-28");
    expect(addPeriod("2028-01-31", "MONTHLY")).toBe("2028-02-29"); // leap year
    expect(addPeriod("2026-10-31", "MONTHLY")).toBe("2026-11-30");
  });

  it("adds one year, clamping Feb 29", () => {
    expect(addPeriod("2026-10-01", "YEARLY")).toBe("2027-10-01");
    expect(addPeriod("2028-02-29", "YEARLY")).toBe("2029-02-28");
  });
});

describe("periodFrom", () => {
  it("runs from 00:00 Cairo on the first day to 00:00 Cairo after the last", () => {
    // Cairo is UTC+3 in October (summer time) and UTC+2 in November.
    const p = periodFrom("2026-10-01", "MONTHLY");
    expect(p.start.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-10-31T22:00:00.000Z");
  });
});

describe("periodStartingToday", () => {
  it("starts on today's Cairo date, not the UTC one", () => {
    // 23:30 UTC on Sep 30 is already Oct 1 in Cairo.
    const p = periodStartingToday("MONTHLY", new Date("2026-09-30T23:30:00Z"));
    expect(p.start.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-10-31T22:00:00.000Z");
  });
});

describe("trialPeriod", () => {
  it("runs whole Cairo days from today", () => {
    // 23:30 UTC on Sep 30 is Oct 1 in Cairo; 14 days ends 00:00 Oct 15.
    const p = trialPeriod(14, new Date("2026-09-30T23:30:00Z"));
    expect(p.start.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-10-14T21:00:00.000Z");
  });

  it("is followed by a renewal from its end", () => {
    const trial = trialPeriod(14, new Date("2026-10-01T09:00:00Z"));
    expect(renewalPeriod(trial.end, "MONTHLY").start.getTime()).toBe(trial.end.getTime());
  });
});

describe("renewalPeriod", () => {
  it("starts where the current period ends", () => {
    const current = periodFrom("2026-10-01", "MONTHLY");
    const next = renewalPeriod(current.end, "MONTHLY");
    expect(next.start.getTime()).toBe(current.end.getTime());
    expect(next.end.getTime()).toBe(periodFrom("2026-11-01", "MONTHLY").end.getTime());
  });

  it("can switch a monthly subscription to yearly at renewal", () => {
    const current = periodFrom("2026-10-01", "MONTHLY");
    expect(renewalPeriod(current.end, "YEARLY").end.getTime()).toBe(
      periodFrom("2027-11-01", "MONTHLY").start.getTime()
    );
  });
});

describe("renewal stages", () => {
  // The period ends at 00:00 Cairo on Nov 1 (22:00 UTC Oct 31).
  const end = periodFrom("2026-10-01", "MONTHLY").end;
  // Noon Cairo (UTC+3 until Oct 30, UTC+2 after) on a date.
  const noonOn = (date: string, offset = 2) =>
    new Date(new Date(`${date}T12:00:00Z`).getTime() - offset * 3_600_000);

  it("counts Cairo days to the end day", () => {
    expect(daysLeft(end, noonOn("2026-10-25", 3))).toBe(7);
    expect(daysLeft(end, noonOn("2026-10-31"))).toBe(1);
    expect(daysLeft(end, noonOn("2026-11-01"))).toBe(0);
  });

  it("is active until 7 days are left, due until 4, then a reminder from 3", () => {
    expect(renewalStage(end, noonOn("2026-10-24", 3))).toBe("active"); // 8 left
    expect(renewalStage(end, noonOn("2026-10-25", 3))).toBe("due"); // 7 left
    expect(renewalStage(end, noonOn("2026-10-28", 3))).toBe("due"); // 4 left
    expect(renewalStage(end, noonOn("2026-10-29", 3))).toBe("reminder"); // 3 left
    expect(renewalStage(end, noonOn("2026-10-31"))).toBe("reminder"); // 1 left
  });

  it("is in grace from the end day for 7 days, then expired", () => {
    expect(renewalStage(end, noonOn("2026-11-01"))).toBe("grace");
    expect(renewalStage(end, noonOn("2026-11-07"))).toBe("grace");
    expect(renewalStage(end, noonOn("2026-11-08"))).toBe("expired");
    expect(graceEndsOn(end)).toBe("2026-11-08");
  });

  it("turns past due at Cairo midnight, not UTC midnight", () => {
    // 22:30 UTC Oct 31 is 00:30 Nov 1 in Cairo.
    expect(renewalStage(end, new Date("2026-10-31T22:30:00Z"))).toBe("grace");
    expect(renewalStage(end, new Date("2026-10-31T21:30:00Z"))).toBe("reminder");
  });
});
