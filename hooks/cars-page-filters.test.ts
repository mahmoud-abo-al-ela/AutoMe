import { describe, it, expect } from "vitest";
import { DEFAULT_FILTERS, clearedFilters, withSuggestion, type CarPageFilters } from "./cars-page-filters";

const filters: CarPageFilters = {
  ...DEFAULT_FILTERS,
  search: "corolla",
  make: ["Toyota", "Kia"],
  bodyType: ["Sedan"],
  dealership: "nile-motors",
  city: "maadi",
  color: "White",
  minSeats: 5,
  minPrice: 300_000,
  maxPrice: 900_000,
  minYear: 2018,
  maxYear: 2022,
  minMileage: 1_000,
  maxMileage: 80_000,
  sortBy: "priceAsc",
};

describe("withSuggestion", () => {
  it("adds a chosen make or spec to the buyer's own, keeping every other filter", () => {
    const next = withSuggestion(filters, { filters: { make: "BMW", bodyType: "SUV" } });
    expect(next.make).toEqual(["Toyota", "Kia", "BMW"]);
    expect(next.bodyType).toEqual(["Sedan", "SUV"]);
    expect(next).toMatchObject({ dealership: "nile-motors", city: "maadi", minPrice: 300_000, maxYear: 2022, sortBy: "priceAsc" });
  });

  it("never adds a value twice", () => {
    expect(withSuggestion(filters, { filters: { make: "Kia" } }).make).toEqual(["Toyota", "Kia"]);
  });

  it("sets a colour as the colour, and a fuel or gearbox as one more", () => {
    const next = withSuggestion(filters, { filters: { color: "Silver", fuelType: "Diesel", transmission: "Manual" } });
    expect(next.color).toBe("Silver");
    expect(next.fuelType).toEqual(["Diesel"]);
    expect(next.transmission).toEqual(["Manual"]);
  });

  it("replaces what was typed with the suggestion's text, or clears it", () => {
    expect(withSuggestion(filters, { filters: { make: "Toyota" }, search: "Corolla" }).search).toBe("Corolla");
    expect(withSuggestion(filters, { filters: { bodyType: "SUV" } }).search).toBeUndefined();
    expect(withSuggestion(filters, { search: "Sunroof" })).toMatchObject({ search: "Sunroof", make: ["Toyota", "Kia"] });
  });

  it("never changes the filters it was given", () => {
    withSuggestion(filters, { filters: { make: "BMW" } });
    expect(filters.make).toEqual(["Toyota", "Kia"]);
  });
});

describe("clearedFilters", () => {
  it("removes one value of a multi-select, keeping the rest", () => {
    expect(clearedFilters(filters, "make", "Kia")?.make).toEqual(["Toyota"]);
  });

  it("clears a whole multi-select when no value is given", () => {
    expect(clearedFilters(filters, "make")?.make).toEqual([]);
  });

  it("clears both ends of a range together", () => {
    const next = clearedFilters(filters, "price");
    expect(next).toMatchObject({ minPrice: undefined, maxPrice: undefined, minYear: 2018 });
    expect(clearedFilters(filters, "year")).toMatchObject({ minYear: undefined, maxYear: undefined });
    expect(clearedFilters(filters, "mileage")).toMatchObject({ minMileage: undefined, maxMileage: undefined });
  });

  it.each(["search", "dealership", "city", "color", "minSeats"] as const)("clears %s alone", (key) => {
    const next = clearedFilters(filters, key)!;
    expect(next[key]).toBeUndefined();
    expect(next.make).toEqual(["Toyota", "Kia"]);
    expect(next.sortBy).toBe("priceAsc");
  });

  it("asks for a full reset for 'all'", () => {
    expect(clearedFilters(filters, "all")).toBeNull();
  });

  it("leaves the filters as they were for an unknown chip, and never changes the original", () => {
    expect(clearedFilters(filters, "nonsense")).toEqual(filters);
    clearedFilters(filters, "make", "Kia");
    expect(filters.make).toEqual(["Toyota", "Kia"]);
  });
});
