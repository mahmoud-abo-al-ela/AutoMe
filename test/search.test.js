import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { searchCarsRanked } from "@/lib/repositories/car/search";
import { findManyCars } from "@/lib/repositories/car/queries";
import { db } from "@/lib/prisma";

const ORG_ID = "org_test_search";
const ORG_SLUG = "test-search-dealer";

function car(overrides) {
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
    expect(cars[0].make).toBe("Toyota");
    expect(cars[0].model).toBe("Corolla");
  });

  it("falls back to trigram similarity for a typo'd model", async () => {
    // "corola" has no FTS match; the pg_trgm fallback still finds Corolla.
    const { cars } = await searchCarsRanked({ search: "corola", organizationId: ORG_ID });

    expect(cars.some((c) => c.model === "Corolla")).toBe(true);
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
