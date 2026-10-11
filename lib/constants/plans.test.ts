import { describe, it, expect } from "vitest";
import { planKeyFor } from "./plans";

describe("planKeyFor", () => {
  it("maps each plan type to its message key", () => {
    expect(planKeyFor("STARTER")).toBe("starter");
    expect(planKeyFor("PRO")).toBe("pro");
    expect(planKeyFor("ENTERPRISE")).toBe("enterprise");
  });

  it("returns null for a missing or unknown type, so the caller falls back to the stored name", () => {
    expect(planKeyFor(undefined)).toBeNull();
    expect(planKeyFor(null)).toBeNull();
    expect(planKeyFor("")).toBeNull();
    expect(planKeyFor("GOLD")).toBeNull();
    expect(planKeyFor("pro")).toBeNull();
  });
});
