import { describe, it, expect } from "vitest";
import { DEFAULT_FILTERS, clearedFilters, type CarPageFilters } from "./cars-page-filters";

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
