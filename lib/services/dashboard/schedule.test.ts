import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/repositories/dashboard/schedule", () => ({}));
vi.mock("@/lib/repositories/user", () => ({}));

import { freeGaps } from "@/lib/services/dashboard/schedule";

const hours = { openTime: "09:00", closeTime: "18:00" };

describe("freeGaps", () => {
  it("is the whole day when nothing is booked", () => {
    expect(freeGaps(hours, [])).toEqual([{ startTime: "09:00", endTime: "18:00", minutes: 540 }]);
  });

  it("is the time between bookings, in order, whatever order they come in", () => {
    const gaps = freeGaps(hours, [
      { startTime: "14:00", endTime: "14:30" },
      { startTime: "10:00", endTime: "10:30" },
    ]);
    expect(gaps).toEqual([
      { startTime: "09:00", endTime: "10:00", minutes: 60 },
      { startTime: "10:30", endTime: "14:00", minutes: 210 },
      { startTime: "14:30", endTime: "18:00", minutes: 210 },
    ]);
  });

  it("treats overlapping bookings as one busy stretch", () => {
    const gaps = freeGaps(hours, [
      { startTime: "10:00", endTime: "11:00" },
      { startTime: "10:30", endTime: "11:30" },
    ]);
    expect(gaps.map((gap) => [gap.startTime, gap.endTime])).toEqual([
      ["09:00", "10:00"],
      ["11:30", "18:00"],
    ]);
  });

  it("clips bookings to opening hours, and leaves no gap when the day is full", () => {
    expect(freeGaps(hours, [{ startTime: "08:00", endTime: "19:00" }])).toEqual([]);
    expect(freeGaps(hours, [{ startTime: "17:30", endTime: "18:30" }]).at(-1)).toEqual({ startTime: "09:00", endTime: "17:30", minutes: 510 });
  });

  it("has no free time on a closed day", () => {
    expect(freeGaps(null, [])).toEqual([]);
  });
});
