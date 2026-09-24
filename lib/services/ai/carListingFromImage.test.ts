import { describe, it, expect } from "vitest";
import { CAR_LISTING_FIELDS, countWrittenFields } from "@/lib/services/ai/carListingFromImage";

describe("countWrittenFields", () => {
  it("counts the fields a partial reply has reached", () => {
    expect(countWrittenFields("")).toBe(0);
    expect(countWrittenFields('{"make":"Kia","model":"Ri')).toBe(2);
  });

  it("reaches the total on a complete reply", () => {
    const complete = JSON.stringify(Object.fromEntries(CAR_LISTING_FIELDS.map((k) => [k, ""])));
    expect(countWrittenFields(complete)).toBe(CAR_LISTING_FIELDS.length);
  });

  it("does not count a key that is only half written", () => {
    // "mod is not yet "model" — the field has not started.
    expect(countWrittenFields('{"make":"Kia","mod')).toBe(1);
  });
});
