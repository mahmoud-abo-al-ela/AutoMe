import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ db: {} }));

import { startOfCurrentMonthCairo } from "@/lib/repositories/ai-usage/queries";

/** A dealer's AI allowance resets at Cairo midnight on the 1st, as billing's calendar does. */
describe("startOfCurrentMonthCairo", () => {
  it("is Cairo midnight on the 1st (22:00 UTC the day before, in winter)", () => {
    expect(startOfCurrentMonthCairo(new Date("2026-11-15T10:00:00Z"))).toEqual(new Date("2026-10-31T22:00:00Z"));
  });

  it("has already turned over in Cairo while UTC is still on the last day", () => {
    // 23:30 UTC on 30 November is 01:30 on 1 December in Cairo: December's
    // allowance. The old UTC month said November for two more hours.
    expect(startOfCurrentMonthCairo(new Date("2026-11-30T23:30:00Z"))).toEqual(new Date("2026-11-30T22:00:00Z"));
  });
});
