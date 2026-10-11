import { describe, it, expect } from "vitest";
import { classifyTerms, inverseDocumentFrequency, isCommon, COMMON_MIN_SCOPE } from "./lexical";

const found = (df: number, dfStructured = df) => ({ df, dfStructured });
const missing = { df: 0, dfStructured: 0 };

describe("classifyTerms", () => {
  it("sets aside a word no car has, and keeps the one that matters", () => {
    // "عربية سيدان" where no listing says "عربية".
    expect(classifyTerms(37, [missing, found(18)]).roles).toEqual(["missing", "filter"]);
  });

  it("ranks by a prose-only word beside a structured one instead of filtering by it", () => {
    // "عربية سيدان" once four descriptions say "عربية": it must not hide the other sedans.
    expect(classifyTerms(37, [found(4, 0), found(18)]).roles).toEqual(["rank", "filter"]);
  });

  it("filters by prose words when nothing structured was typed", () => {
    // "فبريكا" alone still narrows to the cars that say it.
    expect(classifyTerms(37, [found(3, 0)]).roles).toEqual(["filter"]);
  });

  it("ranks by a common word while a rarer one narrows", () => {
    // "سيدان أوتوماتيك" with automatic in 27 of 37 cars.
    expect(classifyTerms(37, [found(18), found(27)]).roles).toEqual(["filter", "rank"]);
  });

  it("filters by common words when nothing rarer is left, and says so", () => {
    const result = classifyTerms(37, [found(27), found(30)]);
    expect(result.roles).toEqual(["filter", "filter"]);
    expect(result.onlyCommon).toBe(true);
  });

  it("treats no word as common in a scope too small to tell", () => {
    expect(isCommon(COMMON_MIN_SCOPE - 1, COMMON_MIN_SCOPE - 1)).toBe(false);
    expect(classifyTerms(5, [found(5), found(1)]).roles).toEqual(["filter", "filter"]);
  });

  it("filters by nothing when every word is missing", () => {
    expect(classifyTerms(37, [missing, missing])).toEqual({ roles: ["missing", "missing"], onlyCommon: false });
  });

  it("filters by nothing when there are no words", () => {
    expect(classifyTerms(37, [])).toEqual({ roles: [], onlyCommon: false });
  });
});

describe("inverseDocumentFrequency", () => {
  it("weighs a rare word above a common one", () => {
    expect(inverseDocumentFrequency(37, 2)).toBeGreaterThan(inverseDocumentFrequency(37, 30));
  });
});
