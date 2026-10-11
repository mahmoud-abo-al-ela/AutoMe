import { describe, it, expect, vi, beforeEach } from "vitest";

const enforceRateLimit = vi.hoisted(() => vi.fn());
const extractTextSearchFilters = vi.hoisted(() => vi.fn());
const getCurrentOrganization = vi.hoisted(() => vi.fn());
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/lib/services/ai", () => ({ extractTextSearchFilters, extractSearchFilters: vi.fn() }));
vi.mock("@/lib/getOrganization", () => ({ getCurrentOrganization }));
vi.mock("@/lib/repositories/car", () => ({ findManyCars: vi.fn() }));
vi.mock("@/lib/services/car/market-price", () => ({ withMarketPositions: vi.fn() }));

import { describeSearch } from "@/actions/home";

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentOrganization.mockResolvedValue(null);
  extractTextSearchFilters.mockResolvedValue({ bodyType: "SUV" });
});

describe("describeSearch", () => {
  it("rate-limits, then reads the description at low priority, attributed to no user", async () => {
    const response = await describeSearch({ query: "automatic SUV under 1.5 million" });
    expect(response).toEqual({ success: true, data: { bodyType: "SUV" } });
    expect(enforceRateLimit).toHaveBeenCalled();
    expect(extractTextSearchFilters).toHaveBeenCalledWith("automatic SUV under 1.5 million", {
      organizationId: null,
      userId: null,
      priority: "low",
    });
  });

  it("never reaches the model with an empty or oversized query", async () => {
    expect(await describeSearch({ query: " " })).toMatchObject({ success: false });
    expect(await describeSearch({ query: "x".repeat(201) })).toMatchObject({ success: false });
    expect(extractTextSearchFilters).not.toHaveBeenCalled();
  });

  it("stops at the rate limit before the model", async () => {
    enforceRateLimit.mockRejectedValue(Object.assign(new Error("Too many"), { statusCode: 429 }));
    expect(await describeSearch({ query: "SUV under 900k please" })).toMatchObject({ success: false });
    expect(extractTextSearchFilters).not.toHaveBeenCalled();
  });
});
