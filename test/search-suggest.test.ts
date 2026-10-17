import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { countPublicMakeModels, countPublicSpecs } from "@/lib/repositories/car/suggest";
import { searchCarsRanked } from "@/lib/repositories/car/search";
import { resetSuggestionsForTests, suggestSearches } from "@/lib/services/car/search-suggestions";
import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

const LIVE = "org_test_suggest_live";
const SUSPENDED = "org_test_suggest_suspended";
const DELETED = "org_test_suggest_deleted";
const ORGS = [LIVE, SUSPENDED, DELETED];

function car(organizationId: string, overrides: Partial<Prisma.CarCreateManyInput>): Prisma.CarCreateManyInput {
  return {
    organizationId,
    make: "Zentrix",
    model: "Quorra",
    year: 2021,
    price: 600000,
    mileage: 20000,
    fuelType: "Petrol",
    transmission: "Automatic",
    color: "White",
    bodyType: "Sedan",
    status: "AVAILABLE",
    images: [],
    features: [],
    ...overrides,
  };
}

const ours = (pairs: { make: string; model: string; count: number }[]) =>
  pairs.filter((pair) => pair.make.startsWith("Zentrix") || pair.make.startsWith("Hidzen"));

describe.skipIf(!hasTestDb)("search suggestions (real Postgres)", () => {
  beforeAll(async () => {
    await db.car.deleteMany({ where: { organizationId: { in: ORGS } } });
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.organization.createMany({
      data: [
        { id: LIVE, name: "Suggest Live", slug: "test-suggest-live", isActive: true },
        { id: SUSPENDED, name: "Suggest Suspended", slug: "test-suggest-suspended", isActive: false },
        { id: DELETED, name: "Suggest Deleted", slug: "test-suggest-deleted", isActive: true, deletedAt: new Date() },
      ],
    });
    await db.car.createMany({
      data: [
        car(LIVE, { model: "Quorra", description: "Zentrixwood trim, quorrasport-like ride" }),
        car(LIVE, { model: "Quorra" }),
        car(LIVE, { model: "Vexa", description: "Zentrixglass roof" }),
        car(LIVE, { model: "Soldo", status: "SOLD" }),
        car(SUSPENDED, { make: "Hidzen", model: "Ghost" }),
        car(DELETED, { make: "Hidzen", model: "Phantom" }),
        // Spec values no other suite writes, so their public counts are this suite's alone.
        car(LIVE, {
          model: "Quorra",
          bodyType: "Convertible",
          fuelType: "Plug-in Hybrid",
          transmission: "Semi-Automatic",
          color: "Bronze",
          features: ["Fog lights"],
        }),
        car(LIVE, { model: "Vexa", bodyType: "Convertible", color: "Dark Bronze", featuresAr: ["كشافات ضباب"] }),
        car(LIVE, { model: "Soldo", bodyType: "Convertible", color: "Bronze", features: ["Fog lights"], status: "SOLD" }),
        car(SUSPENDED, { make: "Hidzen", bodyType: "Convertible", fuelType: "Plug-in Hybrid", color: "Bronze", features: ["Fog lights"] }),
        car(DELETED, { make: "Hidzen", bodyType: "Convertible", transmission: "Semi-Automatic", color: "Bronze", featuresAr: ["كشافات ضباب"] }),
      ],
    });
    resetSuggestionsForTests();
  });

  afterAll(async () => {
    await db.car.deleteMany({ where: { organizationId: { in: ORGS } } });
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.$disconnect();
  });

  it("counts public makes and models only", async () => {
    expect(ours(await countPublicMakeModels()).sort((a, b) => a.model.localeCompare(b.model))).toEqual([
      { make: "Zentrix", model: "Quorra", count: 3 },
      { make: "Zentrix", model: "Vexa", count: 2 },
    ]);
  });

  it("suggests a public make and its models — never a hidden dealership's, nor loose words", async () => {
    expect(await suggestSearches("zentrix", "en")).toEqual([
      { kind: "make", label: "Zentrix", count: 5, filters: { make: "Zentrix" } },
      { kind: "model", label: "Zentrix Quorra", count: 3, filters: { make: "Zentrix" }, search: "Quorra" },
      { kind: "model", label: "Zentrix Vexa", count: 2, filters: { make: "Zentrix" }, search: "Vexa" },
    ]);
    expect(await suggestSearches("hidzen", "en")).toEqual([]);
  });

  describe("spec counts", () => {
    const count = (specs: Awaited<ReturnType<typeof countPublicSpecs>>, kind: string, value: string) =>
      specs.find((spec) => spec.kind === kind && spec.value === value)?.count ?? 0;

    it("count public cars only, by the value a car stores", async () => {
      const specs = await countPublicSpecs(["Bronze"], ["Fog lights"]);
      expect(count(specs, "bodyType", "Convertible")).toBe(2);
      expect(count(specs, "fuelType", "Plug-in Hybrid")).toBe(1);
      expect(count(specs, "transmission", "Semi-Automatic")).toBe(1);
    });

    it("count a colour as the colour filter matches it: by containing the name", async () => {
      // "Bronze" and "Dark Bronze": the filter (ILIKE %Bronze%) finds both.
      expect(count(await countPublicSpecs(["Bronze"], []), "color", "Bronze")).toBe(2);
    });

    it("count a feature as its search finds it, tagged in either language", async () => {
      const featureCount = count(await countPublicSpecs([], ["Fog lights"]), "feature", "Fog lights");
      expect(featureCount).toBe(2);
      const page = { page: 1, limit: 50 };
      expect((await searchCarsRanked({ search: "Fog lights" }, page)).pagination.total).toBe(featureCount);
      expect((await searchCarsRanked({ search: "كشافات ضباب" }, page)).pagination.total).toBe(featureCount);
    });

    it("are offered as suggestions that set the filter, or search the feature", async () => {
      resetSuggestionsForTests();
      expect(await suggestSearches("convert", "en")).toEqual([
        { kind: "bodyType", label: "Convertible", count: 2, filters: { bodyType: "Convertible" } },
      ]);
      expect(await suggestSearches("كشافات", "ar")).toEqual([
        { kind: "feature", label: "كشافات ضباب", count: 2, search: "كشافات ضباب" },
      ]);
    });
  });
});
