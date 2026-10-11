import { describe, it, expect } from "vitest";
import { describedSearchParams, hasFilters, readsLikeSentence } from "@/lib/search/describe";

describe("readsLikeSentence", () => {
  it("leaves short queries to the instant text search", () => {
    for (const query of ["Corolla", "BMW X5", "تويوتا كورولا", "Kia Sportage 2021"]) {
      expect(readsLikeSentence(query), query).toBe(false);
    }
  });

  it("sends descriptions, prices, ranges and seats through the model", () => {
    for (const query of [
      "automatic family SUV in Nasr City",
      "SUV under 900k",
      "عربية تحت مليون",
      "7 seater",
      "كيا ٢٠٢٠ وطالع",
      "sedan 800k",
    ]) {
      expect(readsLikeSentence(query), query).toBe(true);
    }
  });
});

describe("describedSearchParams", () => {
  it("writes each filter as the listing reads it, and the keywords as its text search", () => {
    const params = describedSearchParams({ make: "Kia", maxPrice: 1_500_000, minYear: 2020, keywords: "مدينة نصر" });
    expect(Object.fromEntries(params)).toEqual({ make: "Kia", maxPrice: "1500000", minYear: "2020", search: "مدينة نصر" });
  });
});

describe("hasFilters", () => {
  it("is false when only keywords came back", () => {
    expect(hasFilters({ keywords: "family car" })).toBe(false);
    expect(hasFilters({ bodyType: "SUV", keywords: "family" })).toBe(true);
  });
});
