import { describe, it, expect, vi, beforeEach } from "vitest";

const { findAttentionCandidates, marketPositionsFor } = vi.hoisted(() => ({
  findAttentionCandidates: vi.fn(),
  marketPositionsFor: vi.fn(),
}));
vi.mock("@/lib/repositories/dashboard/today", () => ({ findAttentionCandidates, getTodayBoard: vi.fn() }));
vi.mock("@/lib/repositories/dashboard/insights", () => ({ getInsightRows: vi.fn() }));
vi.mock("@/lib/repositories/dashboard", () => ({ getTestDriveTrends: vi.fn() }));
vi.mock("@/lib/repositories/user", () => ({ findUserByClerkIdWithMemberships: vi.fn() }));
vi.mock("@/lib/services/car/market-price", () => ({ marketPositionsFor }));

import { carsNeedingAttention } from "@/lib/services/dashboard";

const NOW = new Date("2026-10-07T10:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

function car(id: string, overrides: Partial<{ createdAt: Date; testDrives: number; images: string[] }> = {}) {
  return {
    id,
    make: "Kia",
    model: "Cerato",
    bodyType: "Sedan",
    year: 2019,
    price: 875_000,
    priceCurrency: "EGP",
    images: ["a.jpg", "b.jpg", "c.jpg"],
    createdAt: daysAgo(5),
    testDrives: 0,
    ...overrides,
  };
}

const positions = (entries: [string, number][]) =>
  new Map(entries.map(([id, percent]) => [id, { percent, listings: 8, median: 800_000 }]));

beforeEach(() => {
  findAttentionCandidates.mockReset();
  marketPositionsFor.mockReset().mockResolvedValue(new Map());
});

describe("carsNeedingAttention", () => {
  it("flags a car listed 30 days or more with no test drive at all", async () => {
    findAttentionCandidates.mockResolvedValue([car("old", { createdAt: daysAgo(44) }), car("young", { createdAt: daysAgo(29) })]);

    const flagged = await carsNeedingAttention("org-1", NOW);

    expect(flagged.map((c) => [c.id, c.reason])).toEqual([["old", { kind: "stale", days: 44 }]]);
    expect(flagged[0].daysListed).toBe(44);
  });

  it("does not call a car stale once anyone has test-driven it", async () => {
    findAttentionCandidates.mockResolvedValue([car("old", { createdAt: daysAgo(60), testDrives: 1 })]);

    expect(await carsNeedingAttention("org-1", NOW)).toEqual([]);
  });

  it("uses the public gauge's band for 'priced above similar cars' (5% and up)", async () => {
    findAttentionCandidates.mockResolvedValue([car("above"), car("edge"), car("fair")]);
    marketPositionsFor.mockResolvedValue(positions([["above", 8], ["edge", 5], ["fair", 4]]));

    const flagged = await carsNeedingAttention("org-1", NOW);

    expect(flagged.map((c) => c.id)).toEqual(["above", "edge"]);
    expect(flagged[0].reason).toEqual({ kind: "price", percent: 8 });
  });

  it("flags fewer than 3 photos", async () => {
    findAttentionCandidates.mockResolvedValue([car("two", { images: ["a", "b"] }), car("none", { images: [] })]);

    const flagged = await carsNeedingAttention("org-1", NOW);

    // Fewest photos first: the one with none is the worse listing.
    expect(flagged.map((c) => [c.id, c.reason])).toEqual([
      ["none", { kind: "photos", count: 0 }],
      ["two", { kind: "photos", count: 2 }],
    ]);
    expect(flagged[0].image).toBeNull();
  });

  it("gives each car only its most serious reason, and orders stale, then price, then photos", async () => {
    findAttentionCandidates.mockResolvedValue([
      car("photos", { images: ["a"] }),
      car("price"),
      car("stale-and-photos", { createdAt: daysAgo(31), images: [] }),
      car("staler", { createdAt: daysAgo(50) }),
    ]);
    marketPositionsFor.mockResolvedValue(positions([["price", 12], ["stale-and-photos", 20]]));

    const flagged = await carsNeedingAttention("org-1", NOW);

    expect(flagged.map((c) => [c.id, c.reason.kind])).toEqual([
      ["staler", "stale"],
      ["stale-and-photos", "stale"],
      ["price", "price"],
      ["photos", "photos"],
    ]);
  });

  it("leaves out cars with nothing to fix", async () => {
    findAttentionCandidates.mockResolvedValue([car("fine")]);
    marketPositionsFor.mockResolvedValue(positions([["fine", -3]]));

    expect(await carsNeedingAttention("org-1", NOW)).toEqual([]);
  });
});
