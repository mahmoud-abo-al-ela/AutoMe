import { describe, it, expect, vi, beforeEach } from "vitest";

const { findComparablePool, findComparablePrices } = vi.hoisted(() => ({
  findComparablePool: vi.fn(),
  findComparablePrices: vi.fn(),
}));
vi.mock("@/lib/repositories/car", () => ({ findComparablePool, findComparablePrices }));

import { marketPricesFromPool, marketPositionsFor } from "@/lib/services/car/market-price";

const cerato = { id: "c1", make: "Kia", model: "Cerato", bodyType: "Sedan", year: 2019, price: 900_000, priceCurrency: "EGP" };
const pooled = (id: string, model: string, year: number, price: number, bodyType = "Sedan", make = "Kia") => ({ id, make, model, bodyType, year, price });

beforeEach(() => vi.clearAllMocks());

describe("marketPricesFromPool", () => {
  it("uses the same model within a year when that rung has enough listings", () => {
    const pool = [pooled("a", "Cerato", 2019, 1_000_000), pooled("b", "cerato", 2020, 1_000_000), pooled("c", "Cerato", 2018, 1_000_000)];
    const result = marketPricesFromPool(cerato, pool);
    expect(result).toMatchObject({ listings: 3, median: 1_000_000, thisCarVsMedianPercent: -10, compared: { model: "Cerato", years: [2018, 2020] } });
  });

  it("never compares the car with itself", () => {
    const pool = [pooled("c1", "Cerato", 2019, 900_000), pooled("a", "Cerato", 2019, 1_000_000), pooled("b", "Cerato", 2019, 1_000_000)];
    expect(marketPricesFromPool(cerato, pool)).toBeNull();
  });

  it("widens to three years, then to make + body type, never further", () => {
    const threeYears = [pooled("a", "Cerato", 2016, 800_000), pooled("b", "Cerato", 2022, 800_000), pooled("c", "Cerato", 2019, 800_000)];
    expect(marketPricesFromPool(cerato, threeYears)?.compared).toMatchObject({ model: "Cerato", years: [2016, 2022] });

    const bodyType = [pooled("a", "Rio", 2019, 700_000), pooled("b", "Pegas", 2020, 700_000), pooled("c", "K5", 2021, 700_000)];
    expect(marketPricesFromPool(cerato, bodyType)?.compared).toMatchObject({ bodyType: "Sedan", years: [2017, 2021] });

    const otherBody = [pooled("a", "Sportage", 2019, 1_500_000, "SUV"), pooled("b", "Sportage", 2019, 1_500_000, "SUV"), pooled("c", "Sportage", 2019, 1_500_000, "SUV")];
    expect(marketPricesFromPool(cerato, otherBody)).toBeNull();
  });

  it("ignores other makes", () => {
    const pool = [pooled("a", "Cerato", 2019, 1_000_000, "Sedan", "Hyundai"), pooled("b", "Cerato", 2019, 1_000_000, "Sedan", "Hyundai"), pooled("c", "Cerato", 2019, 1_000_000, "Sedan", "Hyundai")];
    expect(marketPricesFromPool(cerato, pool)).toBeNull();
  });
});

describe("marketPositionsFor", () => {
  it("reads one pool per currency and keys positions by car id", async () => {
    findComparablePool.mockResolvedValue([pooled("a", "Cerato", 2019, 1_000_000), pooled("b", "Cerato", 2019, 1_000_000), pooled("c", "Cerato", 2019, 1_000_000)]);
    const positions = await marketPositionsFor([cerato, { ...cerato, id: "c2", year: 2025, price: 2_000_000 }]);

    expect(findComparablePool).toHaveBeenCalledTimes(1);
    expect(findComparablePool).toHaveBeenCalledWith({ makes: ["Kia"], minYear: 2019, maxYear: 2025, yearSpan: 3, currency: "EGP" });
    expect(positions.get("c1")).toEqual({ percent: -10, listings: 3, median: 1_000_000 });
    // 2025 is outside every rung for 2019 cars, and they are the only pool.
    expect(positions.has("c2")).toBe(false);
  });

  it("returns no positions rather than failing when the read fails", async () => {
    findComparablePool.mockRejectedValue(new Error("db down"));
    const positions = await marketPositionsFor([cerato]);
    expect(positions.size).toBe(0);
  });

  it("does not query for an empty page", async () => {
    await marketPositionsFor([]);
    expect(findComparablePool).not.toHaveBeenCalled();
  });
});
