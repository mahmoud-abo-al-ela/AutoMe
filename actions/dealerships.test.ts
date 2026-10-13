import { describe, it, expect, vi, beforeEach } from "vitest";

const service = vi.hoisted(() => ({
  resolvePublicDealershipId: vi.fn(),
  getDealershipCars: vi.fn(),
  getDealershipCarFilters: vi.fn(),
  getDealershipReviews: vi.fn(),
  getDealerships: vi.fn(),
  searchDealerships: vi.fn(),
  getDealershipFilters: vi.fn(),
}));
vi.mock("@/lib/services/dealership", () => service);
vi.mock("@/lib/utils/revalidate", () => ({ revalidateRouteTree: vi.fn() }));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceRateLimit: vi.fn() }));

import {
  getDealershipCarFilters,
  getDealershipCars,
  getDealershipFilters,
  getDealershipReviews,
  getDealerships,
  searchDealerships,
} from "@/actions/dealerships";

/**
 * A public dealership page's reads name the dealership by slug; the id is
 * resolved on the server to one the public may see. A request's own
 * organizationId, status or page size is never passed on.
 */

beforeEach(() => {
  vi.clearAllMocks();
  service.resolvePublicDealershipId.mockResolvedValue("org-resolved");
  service.getDealershipCars.mockResolvedValue({ cars: [], pagination: { page: 1, limit: 9, total: 0, totalPages: 0 } });
  service.getDealershipCarFilters.mockResolvedValue({});
  service.getDealershipReviews.mockResolvedValue({ reviews: [] });
});

describe("getDealershipCars", () => {
  it("reads the dealership the slug resolves to, with only the filters a buyer can set", async () => {
    const response = await getDealershipCars(
      "nile-motors",
      { bodyType: "Sedan,SUV", sortBy: "priceAsc", organizationId: "org-other", status: "SOLD" } as never,
      { page: 2, limit: 9 }
    );
    expect(response).toMatchObject({ success: true });
    expect(service.resolvePublicDealershipId).toHaveBeenCalledWith("nile-motors");
    expect(service.getDealershipCars).toHaveBeenCalledWith(
      "org-resolved",
      { bodyType: "Sedan,SUV", sortBy: "priceAsc" },
      { page: 2, limit: 9 }
    );
  });

  it("refuses a page size beyond the cap, an unknown sort and an empty slug before reading anything", async () => {
    for (const [slug, filters, pagination] of [
      ["nile-motors", {}, { limit: 10_000 }],
      ["nile-motors", { sortBy: "price; DROP TABLE" }, {}],
      ["", {}, {}],
    ] as const) {
      expect(await getDealershipCars(slug, filters as never, pagination), JSON.stringify(pagination)).toMatchObject({ success: false });
    }
    expect(service.getDealershipCars).not.toHaveBeenCalled();
  });

  it("answers not found for a slug that resolves to no public dealership", async () => {
    const { NotFoundError } = await import("@/lib/utils/errors");
    service.resolvePublicDealershipId.mockRejectedValue(new NotFoundError("Dealership"));
    expect(await getDealershipCars("suspended-motors")).toMatchObject({ success: false });
    expect(service.getDealershipCars).not.toHaveBeenCalled();
  });
});

describe("getDealershipCarFilters and getDealershipReviews", () => {
  it("resolve the slug too", async () => {
    await getDealershipCarFilters("nile-motors");
    expect(service.getDealershipCarFilters).toHaveBeenCalledWith("org-resolved");
    await getDealershipReviews("nile-motors", { page: 1, limit: 10 });
    expect(service.getDealershipReviews).toHaveBeenCalledWith("org-resolved", { page: 1, limit: 10 });
  });

  it("caps the reviews page size", async () => {
    expect(await getDealershipReviews("nile-motors", { limit: 500 })).toMatchObject({ success: false });
    expect(service.getDealershipReviews).not.toHaveBeenCalled();
  });
});

describe("the dealerships list", () => {
  it("passes on only what the list page can set — never a plan filter — and caps the page", async () => {
    service.getDealerships.mockResolvedValue({ dealerships: [] });
    await getDealerships({ city: "cairo", sort: "rating", planType: "ENTERPRISE", organizationId: "org-x" } as never, { page: 2, limit: 24 });
    expect(service.getDealerships).toHaveBeenCalledWith({ city: "cairo", sort: "rating" }, { page: 2, limit: 24 });
  });

  it("falls back to the defaults for values a visitor typed into the URL", async () => {
    service.getDealerships.mockResolvedValue({ dealerships: [] });
    await getDealerships({ sort: "drop table", minRating: Number.NaN } as never, { limit: 500 });
    expect(service.getDealerships).toHaveBeenCalledWith({}, {});
  });

  it("validates the search and the facet filters the same way", async () => {
    service.searchDealerships.mockResolvedValue({ dealerships: [] });
    service.getDealershipFilters.mockResolvedValue({});
    await searchDealerships("nile", { planType: "PRO" } as never, { limit: 1_000 });
    expect(service.searchDealerships).toHaveBeenCalledWith("nile", {}, {});
    await getDealershipFilters({ planType: "PRO", region: "CAI" } as never);
    expect(service.getDealershipFilters).toHaveBeenCalledWith({ region: "CAI" });
  });
});
