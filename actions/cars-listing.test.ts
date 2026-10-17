import { describe, it, expect, vi, beforeEach } from "vitest";

const { auth, getCurrentOrganization, getCars, getFilterOptions, withMarketPositions } = vi.hoisted(() => ({
  auth: vi.fn(),
  getCurrentOrganization: vi.fn(),
  getCars: vi.fn(),
  getFilterOptions: vi.fn(),
  withMarketPositions: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth }));
vi.mock("@/lib/getOrganization", () => ({ getCurrentOrganization }));
vi.mock("@/lib/services/car", () => ({ getCars, getFilterOptions, withMarketPositions }));
vi.mock("@/lib/services/wishlist", () => ({ getWishlistCarIds: vi.fn(async () => new Set()) }));
vi.mock("@/lib/utils/revalidate", () => ({ revalidateLocalized: vi.fn() }));

import { getCars as getCarsAction, getCarsFilters } from "@/actions/cars-listing";

const SCOPE = {
  organizationId: "org-other-dealer",
  status: "SOLD",
  onlyAvailable: false,
  meaning: { vector: [1, 2, 3], model: "forged" },
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: null });
  getCurrentOrganization.mockResolvedValue(null);
  getCars.mockResolvedValue({ cars: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 }, search: null, relaxedSearch: null });
  getFilterOptions.mockResolvedValue({});
  withMarketPositions.mockResolvedValue([]);
});

describe("getCars", () => {
  it("never passes a request's scope on: no dealership, status or meaning of its choosing", async () => {
    const response = await getCarsAction({ ...SCOPE, make: ["Toyota"], search: "corolla", page: 2, limit: 24 } as never);
    expect(response).toMatchObject({ success: true });
    const [filters, pagination, userId, organizationId] = getCars.mock.calls[0];
    expect(filters).toEqual({ make: ["Toyota"], search: "corolla", page: 2, limit: 24 });
    expect(pagination).toEqual({ page: 2, limit: 24 });
    expect(userId).toBeNull();
    expect(organizationId).toBeUndefined();
  });

  it("keeps every filter a buyer can choose", async () => {
    const chosen = {
      search: "سيدان",
      dealership: "nile-motors",
      city: "maadi",
      make: "Toyota",
      bodyType: ["Sedan", "SUV"],
      fuelType: ["Hybrid"],
      transmission: ["Automatic"],
      color: "White",
      minSeats: 5,
      minPrice: 300_000,
      maxPrice: 900_000,
      minYear: 2018,
      maxYear: 2022,
      minMileage: 0,
      maxMileage: 80_000,
      featured: true,
      sortBy: "priceAsc",
      exact: true,
    };
    await getCarsAction(chosen);
    expect(getCars.mock.calls[0][0]).toEqual(chosen);
  });

  it("scopes to the storefront's dealership itself, on a subdomain", async () => {
    getCurrentOrganization.mockResolvedValue({ id: "org-storefront" });
    await getCarsAction({ ...SCOPE } as never);
    expect(getCars.mock.calls[0][3]).toBe("org-storefront");
  });

  it("refuses malformed filters before reaching the service", async () => {
    for (const bad of [{ minPrice: "cheap" }, { make: [{}] }, { limit: 100_000 }, { search: "x".repeat(201) }, { exact: "1" }]) {
      expect(await getCarsAction(bad as never), JSON.stringify(bad)).toMatchObject({ success: false });
    }
    expect(getCars).not.toHaveBeenCalled();
  });
});

describe("getCarsFilters", () => {
  it("never passes a request's scope on either", async () => {
    const response = await getCarsFilters({ ...SCOPE, bodyType: ["SUV"] } as never);
    expect(getFilterOptions.mock.calls[0][0]).toEqual({ bodyType: ["SUV"] });
    expect(response).toMatchObject({ success: true, data: { appliedFilters: { bodyType: ["SUV"] } } });
  });

  it("refuses malformed filters before reaching the service", async () => {
    expect(await getCarsFilters({ maxYear: "soon" } as never)).toMatchObject({ success: false });
    expect(getFilterOptions).not.toHaveBeenCalled();
  });
});
