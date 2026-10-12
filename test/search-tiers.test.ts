import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

// The listing service asks a model for the search's meaning; here a test sets it.
vi.mock("@/lib/services/car/search-meaning", () => ({ searchMeaning: vi.fn(async () => null) }));

// The vocabulary is real; a test can make reading it fail.
const vocabulary = vi.hoisted(() => ({ fail: false }));
vi.mock("@/lib/repositories/car/search-terms", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/repositories/car/search-terms")>();
  return {
    ...actual,
    findSimilarWords: (...args: Parameters<typeof actual.findSimilarWords>) =>
      vocabulary.fail ? Promise.reject(new Error("vocabulary unavailable")) : actual.findSimilarWords(...args),
  };
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { searchCarsRanked } from "@/lib/repositories/car/search";
import { setCarEmbedding } from "@/lib/repositories/car/embedding";
import { refreshSearchTerms } from "@/lib/repositories/car/search-terms";
import { getCars } from "@/lib/services/car/listing";
import { db } from "@/lib/prisma";
import { CARS, HIDDEN_TENANT_CARS, OTHER_TENANT_CARS, type RelevanceCar } from "@/test/fixtures/search-relevance";

/**
 * How a search's words match — all of them, some, none (meaning) — judged by
 * the cars in scope rather than a word list, and bounded in every tier by the
 * tenant, the listing's visibility and the buyer's filters. Real Postgres: the
 * judging is SQL.
 */

const ORG = "org_test_tiers";
const PLAIN_ORG = "org_test_tiers_plain";
const OTHER_ORG = "org_test_tiers_other";
const HIDDEN_ORG = "org_test_tiers_hidden";
const MODEL = "gemini-embedding-2";

const keyOf = new Map<string, string>();
const idOf = new Map<string, string>();

function axis(i: number): number[] {
  const out = new Array(768).fill(0);
  out[i] = 1;
  return out;
}

let created = 0;
async function insert(organizationId: string, key: string, car: RelevanceCar) {
  const row = await db.car.create({
    data: {
      organizationId,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price ?? 500_000,
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
  keyOf.set(row.id, key);
  idOf.set(key, row.id);
}

type Result = Awaited<ReturnType<typeof searchCarsRanked>>;
const keys = (result: Result) => result.cars.map((car) => keyOf.get((car as { id: string }).id) ?? "unknown");
const ownKeys = new Set(Object.keys(CARS));

const search = (filters: Record<string, unknown>) =>
  searchCarsRanked({ organizationId: ORG, ...filters }, { page: 1, limit: 50 });

/** Every result is this dealership's own available car — whatever the tier. */
function expectOwn(result: Result) {
  for (const key of keys(result)) {
    expect(ownKeys.has(key), `${key} is not this dealership's car`).toBe(true);
    expect(key).not.toBe("corollaSold");
  }
}

const where = (predicate: (car: RelevanceCar) => boolean) =>
  Object.entries(CARS as Record<string, RelevanceCar>)
    .filter(([, car]) => car.status !== "SOLD" && predicate(car))
    .map(([key]) => key);

const ORGS = [ORG, PLAIN_ORG, OTHER_ORG, HIDDEN_ORG];

describe.skipIf(!hasTestDb)("search tiers (real Postgres)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.organization.createMany({
      data: [
        { id: ORG, name: "Tiers Motors", slug: "tiers-test", isActive: true },
        { id: PLAIN_ORG, name: "Plain Motors", slug: "tiers-test-plain", isActive: true },
        { id: OTHER_ORG, name: "Other Motors", slug: "tiers-test-other", isActive: true },
        { id: HIDDEN_ORG, name: "Hidden Motors", slug: "tiers-test-hidden", isActive: false },
      ],
    });
    for (const [key, car] of Object.entries(CARS)) await insert(ORG, key, car);
    for (const [key, car] of Object.entries(OTHER_TENANT_CARS)) await insert(OTHER_ORG, key, car);
    await insert(OTHER_ORG, "otherBrabus", { make: "Mercedes-Benz", model: "G-Class", year: 2022, bodyType: "SUV", transmission: "Automatic", descriptionEn: "Brabus edition." });
    for (const [key, car] of Object.entries(HIDDEN_TENANT_CARS)) await insert(HIDDEN_ORG, key, car);
    await insert(HIDDEN_ORG, "hiddenMaybach", { make: "Mercedes-Benz", model: "S-Class", year: 2023, bodyType: "Sedan", transmission: "Automatic", descriptionEn: "Maybach package." });

    // Like production before any listing said "عربية": a dealership whose cars never do.
    for (const [key, car] of Object.entries({
      plainSedan1: { make: "Kia", model: "Cerato", year: 2020, bodyType: "Sedan", transmission: "Automatic" },
      plainSedan2: { make: "Hyundai", model: "Elantra", year: 2021, bodyType: "Sedan", transmission: "Automatic" },
      plainSedan3: { make: "Nissan", model: "Sunny", year: 2019, bodyType: "Sedan", transmission: "Manual" },
      plainSuv: { make: "Kia", model: "Sportage", year: 2021, bodyType: "SUV", transmission: "Automatic", descriptionAr: "ناقل حركة اوتوماتيك." },
    } satisfies Record<string, RelevanceCar>)) {
      await insert(PLAIN_ORG, key, car);
    }

    // One car of each dealership means the same thing — the axis the meaning tests query.
    for (const [key, organizationId] of [["x5", ORG], ["otherX5", OTHER_ORG], ["hiddenSedan", HIDDEN_ORG]] as const) {
      await setCarEmbedding({ id: idOf.get(key)!, organizationId, vector: axis(1), model: MODEL, hash: "h" });
    }
    await refreshSearchTerms();
  }, 60_000);

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.$disconnect();
  });

  describe("words no car has", () => {
    it("sets aside a word no listing uses, and finds what the rest asks for (the reported bug)", async () => {
      const result = await searchCarsRanked({ organizationId: PLAIN_ORG, search: "عربية سيدان" }, { page: 1, limit: 50 });
      expect(new Set(keys(result))).toEqual(new Set(["plainSedan1", "plainSedan2", "plainSedan3"]));
      expect(result.search).toEqual({ match: "all", missing: ["عربية"], corrected: [] });
    });

    it("finds the Toyotas for a polite request", async () => {
      const result = await search({ search: "لو سمحت تويوتا" });
      expect(new Set(keys(result))).toEqual(new Set(where((c) => c.make === "Toyota")));
      expect(result.search).toEqual({ match: "all", missing: ["لو", "سمحت"], corrected: [] });
    });

    it("never widens to every car when no word is found", async () => {
      const result = await search({ search: "لو سمحت" });
      expect(result.pagination.total).toBe(0);
      expect(result.search).toEqual({ match: "none", missing: ["لو", "سمحت"], corrected: [] });
    });
  });

  describe("words only in prose, and common words", () => {
    it("ranks by a word dealers write in descriptions instead of hiding every car without it", async () => {
      // Four sedan descriptions say "عربية"; all eighteen sedans are what was asked for.
      const result = await search({ search: "عربية سيدان" });
      const sedans = where((c) => c.bodyType === "Sedan");
      expect(new Set(keys(result))).toEqual(new Set(sedans));
      expect(new Set(keys(result).slice(0, 4))).toEqual(new Set(["corolla18", "elantra", "eClass", "sunny"]));
      expect(result.search).toEqual({ match: "all", missing: [], corrected: [] });
    });

    it("does the same for a generic English word", async () => {
      const result = await search({ search: "car sedan" });
      expect(result.pagination.total).toBe(where((c) => c.bodyType === "Sedan").length);
    });

    it("still narrows by a prose word typed on its own", async () => {
      const result = await search({ search: "فبريكا" });
      expect(new Set(keys(result))).toEqual(new Set(["corolla18", "tucson"]));
    });

    it("ranks by a word most cars have rather than narrowing by it", async () => {
      // 27 of 37 cars are automatic: the sedans are what narrows; automatic ones lead.
      const result = await search({ search: "سيدان أوتوماتيك" });
      const sedans = where((c) => c.bodyType === "Sedan");
      const automatic = where((c) => c.bodyType === "Sedan" && c.transmission === "Automatic");
      expect(new Set(keys(result))).toEqual(new Set(sedans));
      expect(new Set(keys(result).slice(0, automatic.length))).toEqual(new Set(automatic));
    });
  });

  describe("some of the words", () => {
    it("shows the cars with any of the words when none has them all, rarest first", async () => {
      const result = await search({ search: "hilux sunroof" });
      expect(result.search).toEqual({ match: "some", missing: [], corrected: [] });
      expect(keys(result)[0]).toBe("hilux");
      // Every sunroof, the two written in Arabic ("فتحة سقف") included.
      expect(new Set(keys(result))).toEqual(new Set(["hilux", "corolla20", "camry", "x5", "civic", "landCruiser", "tucson", "eClass"]));
      expectOwn(result);
    });

    it("keeps the buyer's filters", async () => {
      const result = await search({ search: "hilux sunroof", make: "Toyota" });
      expect(result.search?.match).toBe("some");
      expect(keys(result).every((key) => (CARS as Record<string, RelevanceCar>)[key].make === "Toyota")).toBe(true);
      expect(keys(result)).not.toContain("x5");
    });
  });

  describe("how a correction is named", () => {
    it("as the listings write the word, not folded", async () => {
      // The vocabulary holds "فتحه"; the Tucson's features say "فتحة سقف".
      const result = await getCars({ search: "فتحت" }, { page: 1, limit: 50 }, null, ORG);
      expect(result.search?.corrected).toEqual([{ from: "فتحت", to: ["فتحة"] }]);
    });
  });

  describe("words that name a car", () => {
    it("match the car's own name, not a description comparing itself to one", async () => {
      // The Kia is "better than a Corolla"; the Sportage has "X5-like comfort".
      expect(new Set(keys(await search({ search: "corolla" })))).toEqual(new Set(["corolla20", "corolla18"]));
      expect(keys(await search({ search: "x5" }))).toEqual(["x5"]);
    });

    it("while a feature still matches a description that mentions it", async () => {
      // The Land Cruiser's sunroof is only in its description.
      expect(keys(await search({ search: "toyota sunroof" }))).toContain("landCruiser");
    });

    it("only when the whole word is a make or model, not the start of one", async () => {
      // "sport" begins "Sportage" but names no car: "M Sport package" and "Sport line" still count.
      expect(new Set(keys(await search({ search: "sport" })))).toEqual(new Set(["sportage", "x5", "bmw320"]));
    });
  });

  describe("feature names in either language", () => {
    const SUNROOFS = ["corolla20", "camry", "x5", "civic", "landCruiser", "tucson", "eClass"];

    it("finds every car with the feature, whichever language tagged or wrote it", async () => {
      expect(new Set(keys(await search({ search: "فتحة سقف" })))).toEqual(new Set(SUNROOFS));
      expect(new Set(keys(await search({ search: "sunroof" })))).toEqual(new Set(SUNROOFS));
    });

    it("maps another feature as itself, not as its neighbour", async () => {
      // "سقف بانوراما" is the Panoramic roof — the Sportage — not a sunroof.
      expect(keys(await search({ search: "سقف بانوراما" }))).toEqual(["sportage"]);
    });

    it("widens a whole feature name only, never a word of one", async () => {
      expect(new Set(keys(await search({ search: "سقف" })))).toEqual(new Set(["tucson", "eClass"]));
      expect(keys(await search({ search: "camera" }))).toEqual(["corolla20"]);
    });
  });

  describe("identifiers, years and mixed languages", () => {
    it("ranks the named model first", async () => {
      expect(keys(await search({ search: "BMW X5" }))).toEqual(["x5"]);
      expect(keys(await search({ search: "320i" }))).toEqual(["bmw320"]);
    });

    it("matches a model year against the year, which the text does not hold", async () => {
      expect(keys(await search({ search: "تويوتا corolla 2020" }))).toEqual(["corolla20"]);
      const sedans2020 = where((c) => c.bodyType === "Sedan" && c.year === 2020);
      expect(new Set(keys(await search({ search: "٢٠٢٠ سيدان" })))).toEqual(new Set(sedans2020));
    });

    it("reads a typo as the word it was probably meant to be, and says so", async () => {
      const result = await search({ search: "corola" });
      // Exactly what the word itself finds.
      expect(keys(result)).toEqual(keys(await search({ search: "corolla" })));
      expect(new Set(keys(result))).toEqual(new Set(["corolla20", "corolla18"]));
      expect(result.search).toEqual({ match: "all", missing: [], corrected: [{ from: "corola", to: ["corolla"] }] });
    });

    it("corrects Arabic, and judges the corrected word like any other", async () => {
      // "فبريكا" is in two descriptions only: prose, so on its own it filters.
      const result = await search({ search: "فبركا" });
      expect(new Set(keys(result))).toEqual(new Set(["corolla18", "tucson"]));
      expect(result.search?.corrected).toEqual([{ from: "فبركا", to: ["فبريكا"] }]);
    });

    it("corrects one word beside others that matched as typed", async () => {
      const result = await search({ search: "تويوتا corola 2020" });
      expect(keys(result)).toEqual(["corolla20"]);
      expect(result.search?.corrected).toEqual([{ from: "corola", to: ["corolla"] }]);
    });

    it("corrects an Arabic make, which no listing spells out, from the names the search knows", async () => {
      const result = await search({ search: "تيوتا" });
      expect(new Set(keys(result))).toEqual(new Set(where((c) => c.make === "Toyota")));
      expect(result.search?.corrected).toEqual([{ from: "تيوتا", to: ["تويوتا"] }]);
    });

    it("names a word once when a listing and the known names both offer it", async () => {
      // The plain dealership's SUV says "اوتوماتيك"; the names know "أوتوماتيك".
      const result = await searchCarsRanked({ search: "اتوماتيك", organizationId: PLAIN_ORG }, { page: 1, limit: 50 });
      expect(result.search?.corrected).toEqual([{ from: "اتوماتيك", to: ["أوتوماتيك"] }]);
    });

    it("never corrects a model code, however close", async () => {
      // "320d" is as alike to "320i" as "corola" is to a word worth reading it as.
      const result = await search({ search: "320d" });
      expect(result.pagination.total).toBe(0);
      expect(result.search).toEqual({ match: "none", missing: ["320d"], corrected: [] });
    });
  });

  describe("filters and tenants bound every tier", () => {
    it("all: the words within the filters", async () => {
      expect(keys(await search({ search: "تويوتا", bodyType: "SUV" }))).toEqual(["landCruiser"]);
    });

    it("a word only another dealership uses is missing here", async () => {
      const result = await search({ search: "brabus" });
      expect(result.pagination.total).toBe(0);
      expect(result.search?.missing).toEqual(["brabus"]);
    });

    it("corrects only to a word a car in this scope has", async () => {
      const own = await search({ search: "brabuss" });
      expect(own.pagination.total).toBe(0);
      expect(own.search).toEqual({ match: "none", missing: ["brabuss"], corrected: [] });

      const everyone = await searchCarsRanked({ search: "brabuss" }, { page: 1, limit: 50 });
      expect(keys(everyone)).toEqual(["otherBrabus"]);
      expect(everyone.search?.corrected).toEqual([{ from: "brabuss", to: ["brabus"] }]);
    });

    it("never corrects to a suspended dealership's word", async () => {
      const result = await searchCarsRanked({ search: "maybachh" }, { page: 1, limit: 50 });
      expect(result.pagination.total).toBe(0);
      expect(result.search?.corrected).toEqual([]);
    });

    it("searches without correction when the vocabulary cannot be read", async () => {
      vocabulary.fail = true;
      try {
        const result = await search({ search: "corola سيدان" });
        expect(result.search).toMatchObject({ match: "all", missing: ["corola"], corrected: [] });
        expect(new Set(keys(result))).toEqual(new Set(where((c) => c.bodyType === "Sedan")));
        // The known names do not depend on the vocabulary.
        expect((await search({ search: "تيوتا" })).search?.corrected).toEqual([{ from: "تيوتا", to: ["تويوتا"] }]);
      } finally {
        vocabulary.fail = false;
      }
    });

    it("the public search finds another active dealership's word, and never a suspended one's", async () => {
      const brabus = await searchCarsRanked({ search: "brabus" }, { page: 1, limit: 50 });
      expect(keys(brabus)).toContain("otherBrabus");
      const maybach = await searchCarsRanked({ search: "maybach" }, { page: 1, limit: 50 });
      expect(keys(maybach)).not.toContain("hiddenMaybach");
      expect(maybach.search?.missing).toEqual(["maybach"]);
    });

    it("the public search never shows a suspended dealership's or a sold car", async () => {
      const result = await searchCarsRanked({ search: "عربية سيدان" }, { page: 1, limit: 100 });
      expect(keys(result)).not.toContain("hiddenSedan");
      expect(keys(result)).not.toContain("corollaSold");
    });

    it("meaning: only this dealership's cars, within the filters", async () => {
      const meaning = { vector: axis(1), model: MODEL };
      const result = await search({ search: "zzqx", meaning });
      expect(keys(result)).toEqual(["x5"]);
      expect(result.search).toEqual({ match: "meaning", missing: ["zzqx"], corrected: [] });
      const filtered = await search({ search: "zzqx", meaning, bodyType: "Sedan" });
      expect(filtered.pagination.total).toBe(0);
    });

    it("meaning, in the public search: never a suspended dealership's car", async () => {
      const result = await searchCarsRanked({ search: "zzqx", meaning: { vector: axis(1), model: MODEL } }, { page: 1, limit: 50 });
      expect(keys(result)).toEqual(expect.arrayContaining(["x5", "otherX5"]));
      expect(keys(result)).not.toContain("hiddenSedan");
    });

    it("words and meaning fused: the words' list is not cut short", async () => {
      const result = await search({ search: "سيدان", meaning: { vector: axis(1), model: MODEL } });
      // Every sedan by its words, plus the X5 by its meaning.
      expect(result.pagination.total).toBe(where((c) => c.bodyType === "Sedan").length + 1);
      expectOwn(result);
    });

    it("none, then the filters' cars: still this dealership's, still filtered", async () => {
      const result = await getCars({ search: "لو سمحت", bodyType: "SUV" }, { page: 1, limit: 50 }, null, ORG);
      expect(result.relaxedSearch).toBe("لو سمحت");
      expect(new Set(keys(result as Result))).toEqual(new Set(where((c) => c.bodyType === "SUV")));
    });
  });
});
