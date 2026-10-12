import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { countPublicMakeModels, findWordsByPrefix } from "@/lib/repositories/car/suggest";
import { refreshSearchTerms } from "@/lib/repositories/car/search-terms";
import { resetSuggestionsForTests, suggestSearches } from "@/lib/services/car/search-suggestions";
import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * Suggestions read public listings only — available cars of active,
 * undeleted dealerships — and count them live. Invented names, so no other
 * suite's cars can supply them.
 */

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
      ],
    });
    await refreshSearchTerms();
    resetSuggestionsForTests();
  });

  afterAll(async () => {
    await db.car.deleteMany({ where: { organizationId: { in: ORGS } } });
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await refreshSearchTerms();
    await db.$disconnect();
  });

  it("counts public makes and models only", async () => {
    expect(ours(await countPublicMakeModels()).sort((a, b) => a.model.localeCompare(b.model))).toEqual([
      { make: "Zentrix", model: "Quorra", count: 2 },
      { make: "Zentrix", model: "Vexa", count: 1 },
    ]);
  });

  it("completes words from the listings, with live counts", async () => {
    const words = await findWordsByPrefix("zentrix", 10);
    expect(words).toEqual(
      expect.arrayContaining([
        { word: "zentrixwood", count: 1 },
        { word: "zentrixglass", count: 1 },
      ])
    );
  });

  it("never offers a word no public car has any more, before the vocabulary catches up", async () => {
    const [glass] = await db.car.findMany({ where: { organizationId: LIVE, model: "Vexa" } });
    await db.car.update({ where: { id: glass!.id }, data: { status: "SOLD" } });
    try {
      const words = (await findWordsByPrefix("zentrix", 10)).map((w) => w.word);
      expect(words).toContain("zentrixwood");
      expect(words).not.toContain("zentrixglass");
    } finally {
      await db.car.update({ where: { id: glass!.id }, data: { status: "AVAILABLE" } });
    }
  });

  it("treats a prefix as text, never as a pattern", async () => {
    expect(await findWordsByPrefix("zen%", 10)).toEqual([]);
    expect(await findWordsByPrefix("zentri_", 10)).toEqual([]);
  });

  it("counts a word with punctuation safely", async () => {
    expect(await findWordsByPrefix("quorrasport-", 10)).toEqual([{ word: "quorrasport-like", count: 1 }]);
  });

  it("suggests a public make, its models and words — never a hidden dealership's", async () => {
    const suggestions = await suggestSearches("zentrix", "en");
    expect(suggestions.slice(0, 3)).toEqual([
      { kind: "make", label: "Zentrix", count: 3, make: "Zentrix" },
      { kind: "model", label: "Zentrix Quorra", count: 2, make: "Zentrix", search: "Quorra" },
      { kind: "model", label: "Zentrix Vexa", count: 1, make: "Zentrix", search: "Vexa" },
    ]);
    expect(suggestions.map((s) => s.label)).toEqual(expect.arrayContaining(["zentrixwood", "zentrixglass"]));
    expect(await suggestSearches("hidzen", "en")).toEqual([]);
  });
});
