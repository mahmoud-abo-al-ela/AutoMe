import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { publicCarDetail, publicCarSummary, publicDealership, type PublicCarRow } from "./projections";
import { carUrl } from "./urls";
import { ServiceUnavailableError } from "@/lib/utils/errors";

/**
 * Golden tests: a row carrying every private value a car or dealership row
 * can hold must come out with exactly the public fields and none of the rest.
 */

const SECRET = {
  email: "owner@dealer.example",
  pendingOwnerEmail: "next-owner@dealer.example",
  organizationId: "org-internal-0001",
  embeddingModel: "gemini-embedding-secret",
  plan: "PLAN_ENTERPRISE_SECRET",
};

/** A car row as wide as the database makes it, with private values planted. */
const ROW = {
  id: "car-1",
  organizationId: SECRET.organizationId,
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  price: 850000,
  priceCurrency: "EGP",
  mileage: 42000,
  fuelType: "Gasoline",
  transmission: "Automatic",
  color: "White",
  seats: 5,
  bodyType: "Sedan",
  featured: true,
  status: "AVAILABLE",
  images: Array.from({ length: 14 }, (_, i) => `https://img/${i}.jpg`),
  title: null,
  titleEn: "Clean Corolla",
  titleAr: "كورولا نظيفة",
  description: null,
  descriptionEn: "x".repeat(3000),
  descriptionAr: null,
  location: "Back lot 3",
  features: ["Sunroof"],
  featuresAr: ["فتحة سقف"],
  imageAlts: { "https://img/0.jpg": { en: "front", ar: "أمام" } },
  originalPaint: true,
  accidentFree: null,
  ownerCount: 1,
  serviceHistory: null,
  priceNegotiable: false,
  licenseValidUntil: "2027-03",
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  embeddingModel: SECRET.embeddingModel,
  embeddingHash: "hash-secret",
  organization: {
    name: "Nile Motors",
    slug: "nile-motors",
    logo: null,
    city: "cairo",
    region: "CAI",
    phone: "0100 123 4567",
    address: "12 Nile St",
    terms: { offersFinancing: true },
    // Planted: never part of a car's dealership on a public page.
    email: SECRET.email,
    pendingOwnerEmail: SECRET.pendingOwnerEmail,
    isActive: true,
    settings: { secret: true },
    subscription: { plan: SECRET.plan },
  },
} as unknown as PublicCarRow;

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://auto-me.example/"));
afterEach(() => vi.unstubAllEnvs());

const leaks = (value: unknown) => Object.values(SECRET).filter((secret) => JSON.stringify(value).includes(secret));

describe("publicCarSummary", () => {
  it("has exactly the public fields, and no private value", () => {
    const summary = publicCarSummary(ROW, "en");
    expect(Object.keys(summary).sort()).toEqual(
      ["bodyType", "color", "dealership", "fuelType", "id", "make", "mileageKm", "model", "place", "price", "status", "thumbnail", "title", "transmission", "url", "year"].sort()
    );
    expect(Object.keys(summary.dealership).sort()).toEqual(["name", "slug"]);
    expect(leaks(summary)).toEqual([]);
  });

  it("reads in the reader's language, with the car's own title or a built one", () => {
    expect(publicCarSummary(ROW, "ar").title).toBe("كورولا نظيفة");
    expect(publicCarSummary({ ...ROW, titleEn: null, titleAr: null }, "en").title).toBe("2020 Toyota Corolla");
  });

  it("refuses a car the public may not see — a caller bug, never output", () => {
    expect(() => publicCarSummary({ ...ROW, status: "UNAVAILABLE" }, "en")).toThrow();
  });
});

describe("publicCarDetail", () => {
  it("adds what the car page shows, bounded, and still no private value", () => {
    const detail = publicCarDetail(ROW, "en", { source: "mcp", medium: "get_car" });
    expect(Object.keys(detail.dealership).sort()).toEqual(["address", "name", "phone", "slug", "terms", "url"]);
    expect(detail.photos).toHaveLength(10);
    expect(detail.description?.text).toHaveLength(1500);
    // Only what the dealer stated: a null is "not stated" and stays out.
    expect(detail.history).toEqual({ originalPaint: true, ownerCount: 1, priceNegotiable: false, licenseValidUntil: "2027-03" });
    expect(detail.listedOn).toBe("2026-09-01");
    expect(detail).not.toHaveProperty("imageAlts");
    expect(detail).not.toHaveProperty("location");
    expect(detail).not.toHaveProperty("featured");
    expect(leaks(detail)).toEqual([]);
  });
});

describe("publicDealership", () => {
  it("states a rating on its scale only when there are reviews, and nothing private", () => {
    const row = { name: "Nile Motors", slug: "nile-motors", averageRating: 4.66, totalReviews: 23, carCount: 8, ...{ email: SECRET.email } };
    const dealership = publicDealership(row, "en");
    expect(dealership.rating).toEqual({ average: 4.7, outOf: 5, reviews: 23 });
    expect(publicDealership({ ...row, totalReviews: 0 }, "en").rating).toBeNull();
    expect(leaks(dealership)).toEqual([]);
  });
});

describe("links", () => {
  it("are built from the configured site, never a request's host, and say where they came from", () => {
    expect(carUrl("car-1", "ar", { source: "mcp", medium: "search_cars" })).toBe(
      "https://auto-me.example/ar/cars/car-1?utm_source=mcp&utm_medium=search_cars"
    );
  });

  it("refuse to exist without a configured site", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(() => carUrl("car-1", "en")).toThrow(ServiceUnavailableError);
  });
});
