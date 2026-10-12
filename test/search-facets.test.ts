import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

// The listing service asks a model for the search's meaning; these tests pass it directly.
vi.mock("@/lib/services/car/search-meaning", () => ({ searchMeaning: vi.fn(async () => null) }));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { searchCarsRanked } from "@/lib/repositories/car/search";
import { searchFacets } from "@/lib/repositories/car/search-facets";
import { setCarEmbedding } from "@/lib/repositories/car/embedding";
import { refreshSearchTerms } from "@/lib/repositories/car/search-terms";
import { getFilterOptions, type CarFilters } from "@/lib/services/car/listing";
import { db } from "@/lib/prisma";
import { CARS, HIDDEN_TENANT_CARS, OTHER_TENANT_CARS, type RelevanceCar } from "@/test/fixtures/search-relevance";

/**
 * The filter panel's counts for a search with text agree with its results:
 * for every filter not chosen, its options' counts are the results grouped by
 * that field — whatever the words did (set aside, corrected, a car's name) —
 * and a chosen one counts what choosing each value gives. Real Postgres.
 */

const ORG = "org_test_facets";
const OTHER_ORG = "org_test_facets_other";
const HIDDEN_ORG = "org_test_facets_hidden";
const ORGS = [ORG, OTHER_ORG, HIDDEN_ORG];
const MODEL = "gemini-embedding-2";
const COUNTED = ["make", "bodyType", "fuelType", "transmission", "color"] as const;

const idOf = new Map<string, string>();
let created = 0;

async function insert(organizationId: string, key: string, car: RelevanceCar) {
  const row = await db.car.create({
    data: {
      organizationId,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price ?? 400_000 + created * 10_000,
      mileage: 40_000,
      fuelType: car.fuelType ?? "Gasoline",
      transmission: car.transmission,
      color: car.color ?? "White",
      bodyType: car.bodyType,
      status: car.status ?? "AVAILABLE",
      images: [],
      features: car.features ?? [],
      featuresAr: car.featuresAr ?? [],
      descriptionEn: car.descriptionEn ?? null,
      descriptionAr: car.descriptionAr ?? null,
      createdAt: new Date(Date.UTC(2026, 1, 1, 0, created++)),
    },
  });
  idOf.set(key, row.id);
}

function axis(i: number): number[] {
  const out = new Array(768).fill(0);
  out[i] = 1;
  return out;
}

type Car = Record<string, unknown>;

/** The results grouped by one field, as the panel would count them. */
function grouped(cars: Car[], field: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const car of cars) {
    const value = car[field] as string | null;
    if (value) out[value] = (out[value] ?? 0) + 1;
  }
  return out;
}

const asMap = (options: { value: string; count: number }[]) =>
  Object.fromEntries(options.map((option) => [option.value, option.count]));

/** Every unchosen filter's counts are exactly the results, grouped. */
async function expectAgree(filters: CarFilters) {
  const [results, facets] = await Promise.all([
    searchCarsRanked(filters, { page: 1, limit: 200 }),
    searchFacets(filters),
  ]);
  expect(facets.total).toBe(results.pagination.total);
  for (const field of COUNTED) {
    if (filters[field]) continue;
    expect(asMap(facets.counts[field]), field).toEqual(grouped(results.cars as Car[], field));
  }
  return { results, facets };
}

describe.skipIf(!hasTestDb)("search facets (real Postgres)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.organization.createMany({
      data: [
        { id: ORG, name: "Facets Motors", slug: "facets-test", city: "maadi", isActive: true },
        { id: OTHER_ORG, name: "Other Facets", slug: "facets-test-other", city: "heliopolis", isActive: true },
        { id: HIDDEN_ORG, name: "Hidden Facets", slug: "facets-test-hidden", city: "zamalek", isActive: false },
      ],
    });
    for (const [key, car] of Object.entries(CARS)) await insert(ORG, key, car);
    for (const [key, car] of Object.entries(OTHER_TENANT_CARS)) await insert(OTHER_ORG, `other:${key}`, car);
    for (const [key, car] of Object.entries(HIDDEN_TENANT_CARS)) await insert(HIDDEN_ORG, `hidden:${key}`, car);
    await insert(HIDDEN_ORG, "hiddenMaybach", { make: "Mercedes-Benz", model: "S-Class", year: 2023, bodyType: "Sedan", transmission: "Automatic", descriptionEn: "Maybach package." });
    await setCarEmbedding({ id: idOf.get("x5")!, organizationId: ORG, vector: axis(1), model: MODEL, hash: "h" });
    await refreshSearchTerms();
  }, 60_000);

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.$disconnect();
  });

  describe("agree with the results, whatever the words did", () => {
    it.each([
      ["a set-aside word (the reported bug)", "عربية سيدان"],
      ["an Arabic make", "تويوتا"],
      ["a typo", "corola"],
      ["an Arabic typo", "تيوتا"],
      ["a car's name, not a comparison in a description", "corolla"],
      ["a feature written in prose too", "toyota sunroof"],
      ["no car having every word", "toyota x5"],
    ])("%s: %s", async (_, search) => {
      const { facets } = await expectAgree({ organizationId: ORG, search });
      expect(facets.total).toBeGreaterThan(0);
    });

    it("agree in exact spelling too: a typo kept as typed counts nothing", async () => {
      const { facets } = await expectAgree({ organizationId: ORG, search: "corola", exact: true });
      expect(facets.total).toBe(0);
      const corrected = await expectAgree({ organizationId: ORG, search: "corola" });
      expect(asMap(corrected.facets.counts.make)).toEqual({ Toyota: 2 });
    });

    it("counts the Corollas for 'corolla', not the Kia that is better than one", async () => {
      const { facets } = await expectAgree({ organizationId: ORG, search: "corolla" });
      expect(asMap(facets.counts.make)).toEqual({ Toyota: 2 });
    });

    it("bounds the price range by the results", async () => {
      const { results, facets } = await expectAgree({ organizationId: ORG, search: "corolla" });
      const prices = (results.cars as Car[]).map((car) => Number(car.price));
      expect(facets.priceRange).toEqual({ min: Math.min(...prices), max: Math.max(...prices) });
    });
  });

  describe("a chosen filter", () => {
    it("counts its chosen value as the results' total, and each other value as choosing it would", async () => {
      const filters = { organizationId: ORG, search: "سيدان", make: ["Toyota"] };
      const { results, facets } = await expectAgree(filters);
      const makes = asMap(facets.counts.make);
      expect(makes.Toyota).toBe(results.pagination.total);
      const hondas = await searchCarsRanked({ ...filters, make: ["Honda"] }, { page: 1, limit: 200 });
      expect(makes.Honda).toBe(hondas.pagination.total);
    });

    it("applies the other filters to every count", async () => {
      await expectAgree({ organizationId: ORG, search: "تويوتا", bodyType: ["Sedan"], transmission: ["Automatic"] });
    });
  });

  describe("meaning", () => {
    it("counts the cars found by meaning, at the results' threshold", async () => {
      const meaning = { vector: axis(1), model: MODEL };
      const facets = await searchFacets({ organizationId: ORG, search: "zzqx", meaning });
      const results = await searchCarsRanked({ organizationId: ORG, search: "zzqx", meaning }, { page: 1, limit: 50 });
      expect(results.pagination.total).toBe(1);
      expect(facets.total).toBe(1);
      expect(asMap(facets.counts.make)).toEqual({ BMW: 1 });
    });

    it("counts by the words alone when the meaning cannot be compared", async () => {
      const facets = await searchFacets({ organizationId: ORG, search: "corolla", meaning: { vector: [1, 2, 3], model: MODEL } });
      expect(asMap(facets.counts.make)).toEqual({ Toyota: 2 });
    });
  });

  describe("tenants and visibility", () => {
    it("a dealership's own search counts only its cars", async () => {
      const facets = await searchFacets({ organizationId: ORG, search: "brabus" });
      expect(facets.total).toBe(0);
      expect(facets.dealerships).toEqual([]);
      expect(facets.cities).toEqual([]);
    });

    it("the public search agrees with its counts", async () => {
      // Within this suite's own city: other test files add and remove public
      // cars while this runs, and two reads of the whole public catalogue — the
      // results, then the counts — can differ by one of theirs.
      await expectAgree({ search: "تويوتا", city: "maadi" });
    });

    it("the public search never counts a suspended dealership", async () => {
      const toyotas = await searchFacets({ search: "تويوتا" });
      expect(toyotas.dealerships.map((d) => d.slug)).toContain("facets-test");
      expect(toyotas.dealerships.map((d) => d.slug)).not.toContain("facets-test-hidden");
      expect(toyotas.cities).not.toContain("zamalek");
      const maybach = await searchFacets({ search: "maybach" });
      expect(maybach.total).toBe(0);
    });

    it("counts each dealership and city as choosing it would, other filters applied", async () => {
      const facets = await searchFacets({ search: "سيدان", dealership: "facets-test" });
      const own = await searchCarsRanked({ search: "سيدان", dealership: "facets-test" }, { page: 1, limit: 200 });
      expect(facets.total).toBe(own.pagination.total);
      expect(facets.dealerships.map((d) => d.slug)).toEqual(expect.arrayContaining(["facets-test", "facets-test-other"]));
    });
  });

  describe("the filter panel (getFilterOptions)", () => {
    it("uses the search's counts", async () => {
      const options = await getFilterOptions({ search: "corolla" }, null, ORG);
      expect(asMap(options.makes)).toEqual({ Toyota: 2 });
    });

    it("drops the words, as the results do, when they empty a filtered search", async () => {
      const options = await getFilterOptions({ search: "لو سمحت", bodyType: ["SUV"] }, null, ORG);
      const plain = await getFilterOptions({ bodyType: ["SUV"] }, null, ORG);
      expect(options.makes).toEqual(plain.makes);
      expect(options.makes.length).toBeGreaterThan(0);
    });

    it("keeps a chosen value in its list when no car has it", async () => {
      const options = await getFilterOptions({ search: "corolla", fuelType: ["Hydrogen"] }, null, ORG);
      expect(options.fuelTypes).toContainEqual({ value: "Hydrogen", count: 0 });
    });
  });
});
