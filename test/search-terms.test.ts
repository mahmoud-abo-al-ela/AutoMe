import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { findSimilarNames, findSimilarWords, refreshSearchTerms } from "@/lib/repositories/car/search-terms";
import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

const LIVE = "org_test_terms_live";
const SUSPENDED = "org_test_terms_suspended";
const DELETED = "org_test_terms_deleted";
const ORGS = [LIVE, SUSPENDED, DELETED];

function car(organizationId: string, overrides: Partial<Prisma.CarCreateManyInput>): Prisma.CarCreateManyInput {
  return {
    organizationId,
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    price: 500000,
    mileage: 40000,
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

async function vocabulary(words: string[]): Promise<string[]> {
  const rows = await db.$queryRaw<{ word: string }[]>`
    SELECT "word" FROM car_search_terms WHERE "word" = ANY(${words}::text[]) ORDER BY "word"
  `;
  return rows.map((row) => row.word);
}

async function cleanUp() {
  await db.car.deleteMany({ where: { organizationId: { in: ORGS } } });
  await db.organization.deleteMany({ where: { id: { in: ORGS } } });
}

describe.skipIf(!hasTestDb)("search vocabulary (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.organization.createMany({
      data: [
        { id: LIVE, name: "Terms Live", slug: "test-terms-live", isActive: true },
        { id: SUSPENDED, name: "Terms Suspended", slug: "test-terms-suspended", isActive: false },
        { id: DELETED, name: "Terms Deleted", slug: "test-terms-deleted", isActive: true, deletedAt: new Date() },
      ],
    });
    await db.car.createMany({
      data: [
        car(LIVE, { model: "Zentravo", description: "Zentravo, family owned" }),
        car(LIVE, { model: "Zentravio" }),
        car(LIVE, { model: "Corolla", descriptionAr: "سيارة كورولانو بحالة ممتازة" }),
        car(LIVE, { model: "Soldquix", status: "SOLD" }),
        car(SUSPENDED, { model: "Suspquix" }),
        car(DELETED, { model: "Delquix" }),
      ],
    });
    await refreshSearchTerms();
  });

  afterAll(async () => {
    await cleanUp();
    await refreshSearchTerms();
    await db.$disconnect();
  });

  it("holds the folded words of publicly listed cars", async () => {
    expect(await vocabulary(["zentravo", "zentravio", "كورولانو"])).toEqual(["zentravio", "zentravo", "كورولانو"]);
  });

  it("leaves out unavailable cars and suspended or deleted dealerships", async () => {
    expect(await vocabulary(["soldquix", "suspquix", "delquix"])).toEqual([]);
  });

  it("counts the cars that have each word", async () => {
    const [row] = await db.$queryRaw<{ ndoc: number }[]>`
      SELECT "ndoc"::int AS "ndoc" FROM car_search_terms WHERE "word" = 'zentravo'
    `;
    // In the model and the description of one car: one car.
    expect(row?.ndoc).toBe(1);
  });

  it("proposes the nearest spellings, best first", async () => {
    const found = await findSimilarWords(["zentrava"], { minSimilarity: 0.4, perToken: 3 });
    expect(found.map((w) => w.word)).toEqual(["zentravo", "zentravio"]);
    expect(found[0]).toMatchObject({ token: "zentrava", ndoc: 1 });
    expect(found[0]!.similarity).toBeGreaterThan(found[1]!.similarity);
  });

  it("works on Arabic, which depends on the database's locale classifying Arabic letters", async () => {
    const found = await findSimilarWords(["كرولانو"], { minSimilarity: 0.4, perToken: 3 });
    expect(found.map((w) => w.word)).toContain("كورولانو");
  });

  it("answers several tokens at once, never proposing a token as itself", async () => {
    const found = await findSimilarWords(["zentravo", "qwxq"], { minSimilarity: 0.4, perToken: 3 });
    expect(found.map((w) => [w.token, w.word])).toEqual([["zentravo", "zentravio"]]);
  });

  it("refuses a floor the trigram index cannot honour", async () => {
    await expect(findSimilarWords(["zentrava"], { minSimilarity: 0.2, perToken: 3 })).rejects.toThrow(RangeError);
  });

  it("measures known names by the same similarity", async () => {
    const found = await findSimilarNames(["تيوتا"], ["تويوتا", "هوندا", "تيوتا"], { minSimilarity: 0.4, perToken: 3 });
    expect(found).toEqual([{ token: "تيوتا", word: "تويوتا", similarity: expect.any(Number), ndoc: 0 }]);
    expect(found[0]!.similarity).toBeGreaterThanOrEqual(0.4);
    await expect(findSimilarNames(["تيوتا"], ["تويوتا"], { minSimilarity: 0.2, perToken: 3 })).rejects.toThrow(RangeError);
  });

  it("refreshes twice at once without either failing", async () => {
    await expect(Promise.all([refreshSearchTerms(), refreshSearchTerms()])).resolves.toBeDefined();
  });
});
