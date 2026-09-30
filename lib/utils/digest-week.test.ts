import { describe, it, expect } from "vitest";
import { digestWeek } from "@/lib/utils/digest-week";

describe("digestWeek", () => {
  it("covers the Saturday–Friday week just ended, in Cairo summer time (UTC+3)", () => {
    // Saturday 2026-09-26, 09:00 Cairo = 06:00 UTC.
    const week = digestWeek(new Date("2026-09-26T06:00:00Z"));
    expect(week.key).toBe("2026-09-19");
    expect(week.start.toISOString()).toBe("2026-09-18T21:00:00.000Z"); // Sat 19th 00:00 +03
    expect(week.end.toISOString()).toBe("2026-09-25T21:00:00.000Z"); // Sat 26th 00:00 +03
    expect(week.weekStart.toISOString()).toBe("2026-09-19T00:00:00.000Z");
    expect(week.due).toBe(true);
  });

  it("uses winter time (UTC+2) in winter", () => {
    // Saturday 2026-12-05, 09:00 Cairo = 07:00 UTC.
    const week = digestWeek(new Date("2026-12-05T07:00:00Z"));
    expect(week.key).toBe("2026-11-28");
    expect(week.start.toISOString()).toBe("2026-11-27T22:00:00.000Z");
    expect(week.end.toISOString()).toBe("2026-12-04T22:00:00.000Z");
    expect(week.due).toBe(true);
  });

  it("is not due on Saturday before 09:00 Cairo — the winter 06:00 UTC run waits", () => {
    expect(digestWeek(new Date("2026-12-05T06:00:00Z")).due).toBe(false); // 08:00 Cairo
    expect(digestWeek(new Date("2026-09-26T05:59:00Z")).due).toBe(false); // 08:59 Cairo
  });

  it("names the same week all week, so a later retry cannot double up", () => {
    const saturday = digestWeek(new Date("2026-09-26T07:00:00Z"));
    const wednesday = digestWeek(new Date("2026-09-30T12:00:00Z"));
    expect(wednesday.key).toBe(saturday.key);
    expect(wednesday.due).toBe(true);
  });

  it("treats Friday night in Cairo as the week still running", () => {
    // Friday 2026-09-25 23:30 Cairo = 20:30 UTC: the week of the 19th is not over.
    expect(digestWeek(new Date("2026-09-25T20:30:00Z")).key).toBe("2026-09-12");
  });
});
