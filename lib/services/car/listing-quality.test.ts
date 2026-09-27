import { describe, it, expect } from "vitest";
import { reviewListing, type ListingForReview } from "@/lib/services/car/listing-quality";

const NOW = new Date("2026-09-27");

const strong: ListingForReview = {
  year: 2020,
  mileage: 62000,
  description: "x".repeat(250),
  features: ["Sunroof", "Leather Seats", "Rear Camera"],
  imageCount: 8,
};

const codes = (listing: Partial<ListingForReview>) =>
  reviewListing({ ...strong, ...listing }, NOW).issues.map((i) => i.code);

describe("reviewListing", () => {
  it("scores a complete listing 100 with nothing to fix", () => {
    expect(reviewListing(strong, NOW)).toEqual({ score: 100, issues: [] });
  });

  it.each([
    [{ imageCount: 1 }, "fewPhotos"],
    [{ imageCount: 4 }, "morePhotos"],
    [{ description: "Clean car." }, "shortDescription"],
    [{ description: "x".repeat(120) }, "briefDescription"],
    [{ features: [] }, "noFeatures"],
    [{ features: ["Sunroof"] }, "fewFeatures"],
    [{ mileage: 0, year: 2018 }, "zeroMileage"],
  ])("flags %o as %s", (listing, code) => {
    expect(codes(listing)).toEqual([code]);
  });

  it("does not flag 0 km on a car from this year or last", () => {
    // Genuinely new stock does have 0 km.
    expect(codes({ mileage: 0, year: 2026 })).toEqual([]);
    expect(codes({ mileage: 0, year: 2025 })).toEqual([]);
  });

  it("ignores whitespace-only description and features", () => {
    expect(codes({ description: " ".repeat(300), features: [" ", ""] })).toEqual([
      "shortDescription",
      "noFeatures",
    ]);
  });

  it("scores by severity and never below zero", () => {
    expect(reviewListing({ ...strong, imageCount: 4 }, NOW).score).toBe(90);
    const worst = reviewListing(
      { year: 2015, mileage: 0, description: "", features: [], imageCount: 0 },
      NOW
    );
    expect(worst.score).toBe(15);
    expect(worst.score).toBeGreaterThanOrEqual(0);
  });
});
