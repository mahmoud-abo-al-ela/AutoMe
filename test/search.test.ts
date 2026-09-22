import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { searchCarsRanked } from "@/lib/repositories/car/search";
import { foldSearchText } from "@/lib/utils/search-text";
import { FOLD_FIXTURES } from "@/lib/utils/search-text.fixtures";
import { findManyCars } from "@/lib/repositories/car/queries";
import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

const ORG_ID = "org_test_search";
const ORG_SLUG = "test-search-dealer";

function car(
  overrides: Partial<Prisma.CarCreateManyInput> = {}
): Prisma.CarCreateManyInput {
  return {
    organizationId: ORG_ID,
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

// The FTS path relies on a generated tsvector column + GIN indexes and the
// trigram fallback on the pg_trgm extension — none expressible in a mock. Needs
// real Postgres with the 20260806120000_add_car_search migration applied.
describe.skipIf(!hasTestDb)("searchCarsRanked (real Postgres)", () => {
  beforeAll(async () => {
    await db.car.deleteMany({ where: { organizationId: ORG_ID } });
    await db.organization.deleteMany({ where: { id: ORG_ID } });
    await db.organization.create({
      data: { id: ORG_ID, name: "Test Search Dealer", slug: ORG_SLUG, isActive: true },
    });
    await db.car.createMany({
      data: [
        car({ make: "Toyota", model: "Corolla", price: 500000 }),
        car({ make: "Toyota", model: "Camry", price: 800000 }),
        car({ make: "Honda", model: "Civic", price: 600000 }),
      ],
    });
  });

  afterAll(async () => {
    await db.car.deleteMany({ where: { organizationId: ORG_ID } });
    await db.organization.deleteMany({ where: { id: ORG_ID } });
    await db.$disconnect();
  });

  it("matches a multi-word query against make + model", async () => {
    const { cars } = await searchCarsRanked({ search: "toyota corolla", organizationId: ORG_ID });

    expect(cars.length).toBeGreaterThan(0);
    // Optional chaining rather than `!`: a null row then fails the assertion
    // with a readable diff instead of a TypeError.
    expect(cars[0]?.make).toBe("Toyota");
    expect(cars[0]?.model).toBe("Corolla");
  });

  it("falls back to trigram similarity for a typo'd model", async () => {
    // "corola" has no FTS match; the pg_trgm fallback still finds Corolla.
    const { cars } = await searchCarsRanked({ search: "corola", organizationId: ORG_ID });

    expect(cars.some((c) => c?.model === "Corolla")).toBe(true);
  });

  it("returns no cars for a term that matches nothing", async () => {
    const { cars } = await searchCarsRanked({ search: "lamborghini", organizationId: ORG_ID });
    expect(cars).toHaveLength(0);
  });
});

describe.skipIf(!hasTestDb)("findManyCars plain-listing branch (real Postgres)", () => {
  beforeAll(async () => {
    await db.car.deleteMany({ where: { organizationId: ORG_ID } });
    await db.organization.deleteMany({ where: { id: ORG_ID } });
    await db.organization.create({
      data: { id: ORG_ID, name: "Test Search Dealer", slug: ORG_SLUG, isActive: true },
    });
    await db.car.createMany({
      data: [car({ model: "Corolla" }), car({ model: "Camry" }), car({ model: "Yaris" })],
    });
  });

  afterAll(async () => {
    await db.car.deleteMany({ where: { organizationId: ORG_ID } });
    await db.organization.deleteMany({ where: { id: ORG_ID } });
    await db.$disconnect();
  });

  it("lists all cars for the org when there is no search term (no FTS path)", async () => {
    const { cars, pagination } = await findManyCars({ organizationId: ORG_ID }, { page: 1, limit: 10 });

    expect(pagination.total).toBe(3);
    expect(cars).toHaveLength(3);
  });
});


// The whole Arabic search story rests on one claim: `foldSearchText` in
// TypeScript and `fold_search_text` in SQL do the same thing. The query is
// built through the first and the stored `searchVector` through the second, so
// if they ever disagree the index answers questions nobody asked — results stop
// being merely incomplete and start being arbitrary.
//
// Two implementations in two languages against two string APIs cannot be kept
// in step by reading them. This runs the same fixtures through both.
describe.skipIf(!hasTestDb)("the search fold agrees across TS and SQL", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it.each(FOLD_FIXTURES)("folds %j the same way", async (value) => {
    const [row] = await db.$queryRaw<{ folded: string }[]>`
      SELECT fold_search_text(${value}) AS folded
    `;

    expect(row?.folded).toBe(foldSearchText(value));
  });

  it("finds an Arabic listing by a differently spelled query", async () => {
    // The end-to-end version of the same claim: written with a ta marbuta,
    // searched with a heh.
    await db.organization.deleteMany({ where: { id: ORG_ID } });
    await db.organization.create({
      data: { id: ORG_ID, name: "Test Search Dealer", slug: ORG_SLUG, isActive: true },
    });
    await db.car.createMany({
      data: [
        car({
          make: "Toyota",
          model: "Corolla",
          title: "سيارة نظيفة جدًا",
          description: "موديل ٢٠٢٠ فابريكا بالكامل",
        }),
      ],
    });

    try {
      for (const term of ["سياره", "سيارة", "نظيفه", "2020"]) {
        const { cars } = await searchCarsRanked({ search: term, organizationId: ORG_ID });
        expect(cars.length, `no match for "${term}"`).toBeGreaterThan(0);
      }
    } finally {
      await db.car.deleteMany({ where: { organizationId: ORG_ID } });
      await db.organization.deleteMany({ where: { id: ORG_ID } });
    }
  });
});
