import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { searchCarsRanked } from "@/lib/repositories/car/search";
import { setCarEmbedding } from "@/lib/repositories/car/embedding";
import { db } from "@/lib/prisma";

/**
 * Words and meaning fused (pgvector + full text), which only real Postgres
 * with the extension can run. Vectors are synthetic: axis-aligned, so which
 * car is "close" to a query is set by the test, not a model.
 */

const ORG = "org_test_hybrid";
const MODEL = "gemini-embedding-2";

function v(i: number, j = i, lean = 0): number[] {
  const out = new Array(768).fill(0);
  out[i] = 1;
  out[j] += lean;
  return out;
}

const ids: Record<string, string> = {};

async function car(key: string, over: Record<string, unknown>, vector?: number[], model = MODEL) {
  const row = await db.car.create({
    data: {
      organizationId: ORG,
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      price: 500000,
      mileage: 40000,
      fuelType: "Gasoline",
      transmission: "Automatic",
      color: "White",
      bodyType: "Sedan",
      status: "AVAILABLE",
      images: [],
      features: [],
      ...over,
    },
  });
  ids[key] = row.id;
  if (vector) await setCarEmbedding({ id: row.id, organizationId: ORG, vector, model, hash: "h" });
}

const names = (result: Awaited<ReturnType<typeof searchCarsRanked>>) =>
  result.cars.map((c) => Object.keys(ids).find((k) => ids[k] === (c as { id: string }).id));

describe.skipIf(!hasTestDb)("hybrid car search (real Postgres + pgvector)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: ORG } });
    await db.organization.create({ data: { id: ORG, name: "Hybrid Motors", slug: "hybrid-test", isActive: true } });
    // The query means axis 1. "family" sits right on it, "roomy" just below,
    // "sporty" far from it; "corolla" matches the words but not the meaning.
    await car("family", { make: "Kia", model: "Sportage", bodyType: "SUV", price: 900000 }, v(1));
    await car("roomy", { make: "Hyundai", model: "Tucson", bodyType: "SUV", price: 800000 }, v(1, 2, 0.2));
    await car("sporty", { make: "Ford", model: "Mustang", bodyType: "Coupe" }, v(9));
    await car("corolla", { make: "Toyota", model: "Corolla", descriptionEn: "Spacious family sedan" }, v(9));
    await car("otherModel", { make: "Nissan", model: "X-Trail", bodyType: "SUV" }, v(1), "gemini-embedding-001");
    await car("unembedded", { make: "Kia", model: "Carnival", bodyType: "Wagon" });
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: ORG } });
    await db.$disconnect();
  });

  const search = (filters: Record<string, unknown>) =>
    searchCarsRanked({ organizationId: ORG, ...filters }, { page: 1, limit: 20 });

  it("returns what the words match and what the meaning matches, fused", async () => {
    const result = await search({ search: "family", meaning: { vector: v(1), model: MODEL } });
    // "corolla" by its words ("family" is in its description), the SUVs by meaning.
    expect(new Set(names(result))).toEqual(new Set(["family", "roomy", "corolla"]));
    expect(result.pagination.total).toBe(3);
  });

  it("adds by meaning only cars near this search's best match, by the same model", async () => {
    const result = await search({ search: "zzqx", meaning: { vector: v(1), model: MODEL } });
    expect(names(result)).toEqual(["family", "roomy"]);
  });

  it("lets the buyer's filters bound the meaning list too", async () => {
    const result = await search({ search: "zzqx", meaning: { vector: v(1), model: MODEL }, maxPrice: 850000 });
    expect(names(result)).toEqual(["roomy"]);
  });

  it("orders the same set by an explicit sort instead", async () => {
    const result = await search({ search: "family", meaning: { vector: v(1), model: MODEL }, sortBy: "priceAsc" });
    expect(names(result)).toEqual(["corolla", "roomy", "family"]);
  });

  it("searches by words alone without a meaning, as before", async () => {
    expect(names(await search({ search: "family" }))).toEqual(["corolla"]);
  });

  it("searches by words alone when the meaning query fails, rather than failing the page", async () => {
    // A vector of the wrong length makes pgvector refuse the query.
    const result = await search({ search: "family", meaning: { vector: [1, 2, 3], model: MODEL } });
    expect(names(result)).toEqual(["corolla"]);
  });

  it("returns nothing for a meaning no car is near, rather than every car", async () => {
    const result = await search({ search: "zzqx", meaning: { vector: v(400), model: MODEL } });
    expect(result.pagination.total).toBe(0);
  });
});
