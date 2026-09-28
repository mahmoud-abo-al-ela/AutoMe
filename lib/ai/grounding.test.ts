import { describe, it, expect } from "vitest";
import {
  buildListingFacts,
  citationsHold,
  closestByPrice,
  COMPARISONS,
  comparisonFor,
  summarizeMarketPrices,
  type ListingSource,
  type OtherCar,
} from "@/lib/ai/grounding";

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
  listedOn: "2026-09-01",
  photos: [],
  dealership: { name: "Nile Motors", place: "Cairo", address: null, phone: null, website: null, about: null, rating: null },
  workingHours: [
    { dayOfWeek: ["SATURDAY", "SUNDAY"], openTime: "10:00", closeTime: "20:00", isOpen: true },
    { dayOfWeek: ["FRIDAY"], openTime: "09:00", closeTime: "18:00", isOpen: false },
  ],
  history: {},
  terms: {},
  otherCars: [],
  marketPrices: null,
  dealerAnswers: [],
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

describe("what AutoMe already knows", () => {
  it("carries photos, alternatives, prices and the rating only when there are any", () => {
    const empty = buildListingFacts(source);
    for (const key of ["photos", "marketPrices"]) expect(empty).not.toHaveProperty(key);
    // Read and empty is a fact; unknown is not.
    expect(empty.otherCars).toEqual([]);
    expect(buildListingFacts({ ...source, otherCars: null })).not.toHaveProperty("otherCars");
    expect(empty.dealership).not.toHaveProperty("rating");
    expect(empty.listedOn).toBe("2026-09-01");

    const facts = buildListingFacts({
      ...source,
      photos: ["Black leather seats", " "],
      dealership: { ...source.dealership, rating: { average: 4.6, reviews: 12 } },
      otherCars: [{ year: 2020, make: "Toyota", model: "Corolla", color: "Black", price: 900000, mileage: 50000, bodyType: "Sedan", transmission: "Automatic", fuelType: "Petrol" }],
    });
    expect(facts.photos).toEqual(["Black leather seats"]);
    expect((facts.dealership as { rating: unknown }).rating).toEqual({ average: 4.6, reviews: 12 });
    expect((facts.otherCars as { price: unknown }[])[0].price).toEqual({ amount: 900000, currency: "EGP" });
  });

  it("numbers the other cars for an answer to name, and keeps their ids and photos from the model", () => {
    const other = { year: 2020, make: "Kia", model: "K5", color: "Red", price: 1, mileage: 1, bodyType: "Sedan", transmission: "Automatic", fuelType: "Petrol" };
    const rows = [
      { ...other, id: "car-a", image: "https://img/a.jpg" },
      { ...other, id: "car-b", image: null },
    ];
    const cars = buildListingFacts({ ...source, otherCars: rows }).otherCars as Record<string, unknown>[];
    expect(cars.map((car) => car.ref)).toEqual([1, 2]);
    expect(JSON.stringify(cars)).not.toMatch(/car-a|img\/a|"id"|"image"/);
  });
});

describe("summarizeMarketPrices", () => {
  const car = { price: 720000, currency: "EGP" };
  const compared = { make: "Hyundai", model: "Elantra", years: [2018, 2020] as [number, number] };

  it("computes the range, the median and where this car sits, so the model does no arithmetic", () => {
    expect(summarizeMarketPrices([800000, 700000, 750000, 850000], car, compared)).toEqual({
      listings: 4,
      min: 700000,
      median: 775000,
      max: 850000,
      currency: "EGP",
      thisCarVsMedianPercent: -7,
      compared,
    });
  });

  it("says nothing from fewer than three listings", () => {
    expect(summarizeMarketPrices([700000, 800000], car, compared)).toBeNull();
  });
});

describe("comparisons", () => {
  const car = { make: "BMW", model: "X4", bodyType: "SUV", year: 2023 };

  it("widens from the same model to the same make and body type, never further", () => {
    expect(COMPARISONS.map((level) => comparisonFor(car, level))).toEqual([
      { make: "BMW", model: "X4", years: [2022, 2024] },
      { make: "BMW", model: "X4", years: [2020, 2026] },
      { make: "BMW", bodyType: "SUV", years: [2021, 2025] },
    ]);
  });
});

describe("closestByPrice", () => {
  it("offers the alternatives nearest this car's price", () => {
    const at = (price: number) => ({ price }) as OtherCar;
    const picked = closestByPrice([at(2_000_000), at(700_000), at(760_000), at(100_000)], 720_000, 2);
    expect(picked.map((c) => c.price)).toEqual([700_000, 760_000]);
  });
});

describe("history and terms", () => {
  it("carries only what the dealer stated", () => {
    const facts = buildListingFacts({
      ...source,
      history: { accidentFree: true, ownerCount: 1 },
      terms: { offersFinancing: true, financingNote: "NBE, 5 years" },
    });
    expect(facts.history).toEqual({ accidentFree: true, ownerCount: 1 });
    expect(facts.dealershipTerms).toEqual({ offersFinancing: true, financingNote: "NBE, 5 years" });
  });

  it("leaves both out when nothing was stated, so a question about them is declined", () => {
    const facts = buildListingFacts(source);
    expect(facts).not.toHaveProperty("history");
    expect(facts).not.toHaveProperty("dealershipTerms");
  });
});

describe("dealer answers", () => {
  it("carries answered questions, marking dealership-wide ones", () => {
    const facts = buildListingFacts({
      ...source,
      dealerAnswers: [
        { question: "Any accidents?", answer: "None.", appliesToAllCars: false },
        { question: "Instalments?", answer: "Yes, with NBE.", appliesToAllCars: true },
      ],
    });
    expect(facts.dealerAnswers).toEqual([
      { question: "Any accidents?", answer: "None.", about: "thisCar" },
      { question: "Instalments?", answer: "Yes, with NBE.", about: "allCars" },
    ]);
  });

  it("leaves the fact out when no answer has text", () => {
    const facts = buildListingFacts({
      ...source,
      dealerAnswers: [{ question: "Any accidents?", answer: "  ", appliesToAllCars: false }],
    });
    expect(facts).not.toHaveProperty("dealerAnswers");
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
