import { describe, it, expect } from "vitest";
import { buildListingFacts, citationsHold, type ListingSource } from "@/lib/ai/grounding";

const source: ListingSource = {
  make: "Toyota",
  model: "Corolla",
  year: 2019,
  bodyType: "Sedan",
  color: "White",
  seats: 5,
  fuelType: "Petrol",
  transmission: "Automatic",
  mileage: 62000,
  price: 850000,
  priceCurrency: "EGP",
  status: "AVAILABLE",
  title: null,
  titleEn: "2019 Toyota Corolla",
  titleAr: null,
  description: null,
  descriptionEn: "One owner.",
  descriptionAr: "مالك واحد.",
  features: ["Sunroof"],
  featuresAr: [],
  dealership: { name: "Nile Motors", place: "Cairo", address: null, phone: null },
  workingHours: [
    { dayOfWeek: ["SATURDAY", "SUNDAY"], openTime: "10:00", closeTime: "20:00", isOpen: true },
    { dayOfWeek: ["FRIDAY"], openTime: "09:00", closeTime: "18:00", isOpen: false },
  ],
};

describe("buildListingFacts", () => {
  it("leaves out what the listing does not state", () => {
    const facts = buildListingFacts({
      ...source,
      seats: null,
      mileage: 0,
      features: [" "],
      descriptionEn: null,
      descriptionAr: "  ",
      workingHours: [],
    });
    for (const key of ["seats", "mileage", "features", "description", "workingHours"]) {
      expect(facts).not.toHaveProperty(key);
    }
  });

  it("keeps the price in its own currency, unconverted", () => {
    expect(buildListingFacts(source).price).toEqual({ amount: 850000, currency: "EGP" });
  });

  it("carries both languages, falling back to the legacy column for English", () => {
    const facts = buildListingFacts({ ...source, descriptionEn: null, description: "Legacy." });
    expect(facts.description).toEqual({ en: "Legacy.", ar: "مالك واحد." });
  });

  it("states closed days as closed, without hours", () => {
    expect(buildListingFacts(source).workingHours).toEqual([
      { days: ["SATURDAY", "SUNDAY"], open: true, opens: "10:00", closes: "20:00" },
      { days: ["FRIDAY"], open: false },
    ]);
  });

  it("bounds free text so a long description cannot inflate every call", () => {
    const facts = buildListingFacts({ ...source, descriptionEn: "x".repeat(5000) });
    expect((facts.description as { en: string }).en.length).toBeLessThanOrEqual(1501);
  });
});

describe("citationsHold", () => {
  const facts = buildListingFacts({ ...source, seats: null });

  it("holds when every cited fact is in the listing", () => {
    expect(citationsHold(facts, ["color", "year"])).toBe(true);
  });

  it("fails an answer that cites nothing", () => {
    expect(citationsHold(facts, [])).toBe(false);
  });

  it("fails an answer that cites a fact this listing lacks", () => {
    expect(citationsHold(facts, ["color", "seats"])).toBe(false);
  });
});
