import { describe, it, expect } from "vitest";
import { upgradeBannerState } from "./plan-banner";

const state = (current: number, limit: number, planType = "Starter") =>
  upgradeBannerState({ current, limit, planType });

describe("upgradeBannerState", () => {
  it("does not claim a fresh org has exhausted a feature its plan never had", () => {
    // The regression. Starter seeds aiProcessing as { enabled: false,
    // limit: 0 }, so an org that has never made an AI call arrives here at
    // 0 of 0 — which `current >= limit` read as "at limit".
    expect(state(0, 0)).toBe("notIncluded");
  });

  it("stays hidden on an unlimited plan however much is used", () => {
    expect(state(0, -1)).toBe("hidden");
    expect(state(9999, -1)).toBe("hidden");
  });

  it("reports no plan before anything else", () => {
    // An org with no subscription reports limit 0 too, but "the NONE plan
    // doesn't include cars" is not a sentence worth showing anyone.
    expect(state(0, 0, "NONE")).toBe("noPlan");
    expect(state(5, 15, "NONE")).toBe("noPlan");
  });

  it("keeps an unlimited plan hidden even with no subscription named", () => {
    expect(state(0, -1, "NONE")).toBe("hidden");
  });

  it("warns from four fifths of the limit", () => {
    expect(state(11, 15)).toBe("hidden");
    expect(state(12, 15)).toBe("nearLimit");
    expect(state(14, 15)).toBe("nearLimit");
  });

  it("reports the limit reached at and beyond it", () => {
    expect(state(15, 15)).toBe("atLimit");
    expect(state(16, 15)).toBe("atLimit");
  });

  it("treats a single-unit limit as reached only once it is used", () => {
    expect(state(0, 1)).toBe("hidden");
    expect(state(1, 1)).toBe("atLimit");
  });
});
