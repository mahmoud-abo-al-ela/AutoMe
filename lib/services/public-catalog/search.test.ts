import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { findManyCars, findPublicCarById } = vi.hoisted(() => ({ findManyCars: vi.fn(), findPublicCarById: vi.fn() }));
vi.mock("@/lib/repositories/car", () => ({ findManyCars, findPublicCarById }));

import { getPublicCar, searchPublicCars } from "./search";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

const CAR = {
  id: "car-1", make: "Toyota", model: "Corolla", year: 2020, price: 850000, mileage: 1, bodyType: "Sedan",
  fuelType: "Gasoline", transmission: "Automatic", color: "White", status: "AVAILABLE", images: [],
  organization: { name: "Nile Motors", slug: "nile-motors" },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://auto-me.example");
  findManyCars.mockResolvedValue({ cars: [CAR], pagination: { total: 1 }, search: { match: "all", missing: [], corrected: [] } });
});
afterEach(() => vi.unstubAllEnvs());

describe("searchPublicCars", () => {
  it("searches the public scope by words alone — no dealership id, status or meaning of its own", async () => {
    await searchPublicCars({ query: "  corolla ", make: ["Toyota"], sort: "priceAsc", page: 2, limit: 5 }, "en");
    const [filters, pagination] = findManyCars.mock.calls[0];
    expect(filters).toMatchObject({ search: "corolla", make: ["Toyota"], sortBy: "priceAsc" });
    for (const key of ["organizationId", "status", "onlyAvailable", "meaning"]) {
      expect(filters[key], key).toBeUndefined();
    }
    expect(pagination).toEqual({ page: 2, limit: 5 });
  });

  it("leaves 'best' to each path's own default order", async () => {
    await searchPublicCars({ query: "corolla", sort: "best" }, "en");
    expect(findManyCars.mock.calls[0][0].sortBy).toBeUndefined();
  });

  it("counts up to the window and says whether there is more", async () => {
    findManyCars.mockResolvedValue({ cars: [CAR], pagination: { total: 9000 } });
    const results = await searchPublicCars({ page: 20, limit: 19 }, "en");
    expect(results.total).toBe(400);
    expect(results.hasMore).toBe(true);
    findManyCars.mockResolvedValue({ cars: [CAR], pagination: { total: 1 } });
    expect((await searchPublicCars({}, "en")).hasMore).toBe(false);
  });

  it("passes on the engine's corrections and missing words, and omits them when there are none", async () => {
    findManyCars.mockResolvedValue({
      cars: [CAR], pagination: { total: 1 },
      search: { match: "all", missing: ["please"], corrected: [{ from: "corola", to: ["corolla"] }] },
    });
    expect(await searchPublicCars({ query: "please corola" }, "en")).toMatchObject({
      corrected: [{ from: "corola", to: ["corolla"] }], missing: ["please"],
    });
    findManyCars.mockResolvedValue({ cars: [CAR], pagination: { total: 1 } });
    const plain = await searchPublicCars({}, "en");
    expect(plain).not.toHaveProperty("corrected");
    expect(plain).not.toHaveProperty("missing");
  });

  it("refuses a page size or a page beyond the limits before searching", async () => {
    for (const bad of [{ limit: 21 }, { limit: 0 }, { page: 21 }, { page: 21, limit: 20 }, { page: 1.5 }]) {
      await expect(searchPublicCars(bad, "en"), JSON.stringify(bad)).rejects.toBeInstanceOf(ValidationError);
    }
    expect(findManyCars).not.toHaveBeenCalled();
  });
});

describe("getPublicCar", () => {
  it("is not found when the public read finds nothing", async () => {
    findPublicCarById.mockResolvedValue(null);
    await expect(getPublicCar("hidden", "en")).rejects.toBeInstanceOf(NotFoundError);
  });
});
