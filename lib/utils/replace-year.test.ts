import { describe, it, expect } from "vitest";
import { asModelYear, replaceYear } from "@/lib/utils/replace-year";

describe("replaceYear", () => {
  it("replaces the year in each script's own digits", () => {
    expect(replaceYear("كيا سيراتو ٢٠٢٠ سيدان سوداء", 2020, 2021)).toBe("كيا سيراتو ٢٠٢١ سيدان سوداء");
    expect(replaceYear("2020 Kia Cerato, a 2020 sedan", 2020, 2019)).toBe("2019 Kia Cerato, a 2019 sedan");
    expect(replaceYear("موديل ٢٠٢٠ (2020)", 2020, 2022)).toBe("موديل ٢٠٢٢ (2022)");
  });

  it("leaves a number that only contains the year alone", () => {
    expect(replaceYear("120200 km, ٢٠٢٠٥ كم", 2020, 2021)).toBe("120200 km, ٢٠٢٠٥ كم");
  });

  it("leaves text without the year untouched", () => {
    expect(replaceYear("Black sedan", 2020, 2021)).toBe("Black sedan");
    expect(replaceYear("", 2020, 2021)).toBe("");
  });
});

describe("asModelYear", () => {
  it("accepts a complete year only", () => {
    expect(asModelYear("2021")).toBe(2021);
    expect(asModelYear(2019)).toBe(2019);
    // Half-typed: the form must not rewrite text for these.
    expect(asModelYear("202")).toBeNull();
    expect(asModelYear("")).toBeNull();
  });
});
