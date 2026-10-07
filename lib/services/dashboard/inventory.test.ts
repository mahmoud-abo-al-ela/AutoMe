import { describe, it, expect, vi, beforeEach } from "vitest";

const { findInventory, countInventoryByStatus, marketPositionsFor, findUser } = vi.hoisted(() => ({
  findInventory: vi.fn(),
  countInventoryByStatus: vi.fn(),
  marketPositionsFor: vi.fn(),
  findUser: vi.fn(),
}));
vi.mock("@/lib/repositories/dashboard/inventory", () => ({ findInventory, countInventoryByStatus }));
vi.mock("@/lib/repositories/dashboard/today", () => ({ findAttentionCandidates: vi.fn(), getTodayBoard: vi.fn() }));
vi.mock("@/lib/repositories/dashboard/insights", () => ({ getInsightRows: vi.fn() }));
vi.mock("@/lib/repositories/dashboard", () => ({ getTestDriveTrends: vi.fn() }));
vi.mock("@/lib/repositories/user", () => ({ findUserByClerkIdWithMemberships: findUser }));
vi.mock("@/lib/services/car/market-price", () => ({ marketPositionsFor }));

import { getInventory, getInventoryCounts } from "@/lib/services/dashboard";
import { inventorySchema } from "@/lib/validations/schemas";

const DAY_MS = 86_400_000;
const member = { role: "USER", memberships: [{ organizationId: "org-1" }] };

function car(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    make: "Kia",
    model: "Cerato",
    year: 2019,
    bodyType: "Sedan",
    title: null,
    titleEn: null,
    titleAr: null,
    price: 875_000,
    priceCurrency: "EGP",
    images: ["a.jpg", "b.jpg", "c.jpg"],
    status: "AVAILABLE",
    featured: false,
    createdAt: new Date(Date.now() - 5 * DAY_MS),
    saves: 0,
    testDrives: 0,
    ...overrides,
  };
}

beforeEach(() => {
  findInventory.mockReset();
  countInventoryByStatus.mockReset();
  marketPositionsFor.mockReset().mockResolvedValue(new Map());
  findUser.mockReset().mockResolvedValue(member);
});

describe("getInventory", () => {
  it("asks for the view's status and the requested page, 20 cars a page", async () => {
    findInventory.mockResolvedValue({ total: 45, cars: [] });

    const result = await getInventory("user-1", "org-1", inventorySchema.parse({ view: "sold", page: 3, sort: "price", dir: "asc" }));

    expect(findInventory).toHaveBeenCalledWith("org-1", expect.objectContaining({ status: "SOLD", skip: 40, take: 20, sort: "price", dir: "asc" }));
    expect(result).toMatchObject({ total: 45, page: 3, totalPages: 3 });
  });

  it("does not filter by status on the All view", async () => {
    findInventory.mockResolvedValue({ total: 0, cars: [] });

    await getInventory("user-1", "org-1", inventorySchema.parse({}));

    expect(findInventory.mock.calls[0][1].status).toBeUndefined();
  });

  it("gives a car on sale its reason to look, and a hidden or sold car none", async () => {
    findInventory.mockResolvedValue({
      total: 3,
      cars: [
        car("few-photos", { images: ["a.jpg"] }),
        car("hidden", { images: [], status: "UNAVAILABLE" }),
        car("sold", { images: [], status: "SOLD" }),
      ],
    });

    const { cars } = await getInventory("user-1", "org-1", inventorySchema.parse({}));

    expect(cars.map((row) => [row.id, row.attention])).toEqual([
      ["few-photos", { kind: "photos", count: 1 }],
      ["hidden", null],
      ["sold", null],
    ]);
    expect(cars[1].image).toBeNull();
  });

  it("carries where the price sits among similar cars", async () => {
    findInventory.mockResolvedValue({ total: 1, cars: [car("above")] });
    marketPositionsFor.mockResolvedValue(new Map([["above", { percent: 8, listings: 9, median: 800_000 }]]));

    const { cars } = await getInventory("user-1", "org-1", inventorySchema.parse({}));

    expect(cars[0]).toMatchObject({ marketPercent: 8, attention: { kind: "price", percent: 8 } });
  });

  it("refuses someone outside the organization", async () => {
    findUser.mockResolvedValue({ role: "USER", memberships: [{ organizationId: "org-2" }] });

    await expect(getInventory("user-1", "org-1", inventorySchema.parse({}))).rejects.toThrow();
    expect(findInventory).not.toHaveBeenCalled();
  });
});

describe("getInventoryCounts", () => {
  it("counts each status, statuses with no cars as zero, and the total", async () => {
    countInventoryByStatus.mockResolvedValue([
      { status: "AVAILABLE", _count: { _all: 19 } },
      { status: "SOLD", _count: { _all: 3 } },
    ]);

    expect(await getInventoryCounts("user-1", "org-1")).toEqual({ all: 22, AVAILABLE: 19, UNAVAILABLE: 0, SOLD: 3 });
  });
});

describe("inventorySchema", () => {
  it("rejects an unknown view or sort rather than guessing", () => {
    expect(inventorySchema.safeParse({ view: "attention" }).success).toBe(false);
    expect(inventorySchema.safeParse({ sort: "mileage" }).success).toBe(false);
  });
});
