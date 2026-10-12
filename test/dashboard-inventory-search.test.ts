import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { findInventory, type InventoryQuery, type InventorySort } from "@/lib/repositories/dashboard/inventory";
import { refreshSearchTerms } from "@/lib/repositories/car/search-terms";
import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * The dealer's Cars table searches with the buyers' engine — Arabic, synonyms,
 * typos — over the dealership's own cars only, every status, keeping the
 * table's own sorting and paging. Real Postgres.
 */

const OWN = "org_test_inventory_own";
const OTHER = "org_test_inventory_other";
const USERS = ["user_test_inventory_1", "user_test_inventory_2"];
const keyOf = new Map<string, string>();

async function car(organizationId: string, key: string, data: Partial<Prisma.CarUncheckedCreateInput>, minutesAgo: number) {
  const row = await db.car.create({
    data: {
      organizationId,
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      price: 500_000,
      mileage: 10_000,
      fuelType: "Gasoline",
      transmission: "Automatic",
      color: "White",
      bodyType: "Sedan",
      status: "AVAILABLE",
      images: [],
      features: [],
      createdAt: new Date(Date.UTC(2026, 5, 1) - minutesAgo * 60_000),
      ...data,
    },
  });
  keyOf.set(row.id, key);
  return row.id;
}

const query = (overrides: Partial<InventoryQuery> = {}): InventoryQuery => ({
  sort: "listed",
  dir: "desc",
  skip: 0,
  take: 50,
  ...overrides,
});
const keys = async (overrides: Partial<InventoryQuery>) =>
  (await findInventory(OWN, query(overrides))).cars.map((c) => keyOf.get(c.id));

async function cleanUp() {
  await db.organization.deleteMany({ where: { id: { in: [OWN, OTHER] } } });
  await db.user.deleteMany({ where: { id: { in: USERS } } });
}

describe.skipIf(!hasTestDb)("dealer inventory search (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.organization.createMany({
      data: [
        { id: OWN, name: "Inventory Own", slug: "test-inventory-own", isActive: true },
        { id: OTHER, name: "Inventory Other", slug: "test-inventory-other", isActive: true },
      ],
    });
    await db.user.createMany({ data: USERS.map((id) => ({ id, clerkId: `clerk_${id}` })) });

    const corolla = await car(OWN, "corolla", { price: 450_000 }, 5);
    const camry = await car(OWN, "camry", { model: "Camry", price: 700_000, status: "SOLD" }, 4);
    const yaris = await car(OWN, "yaris", { model: "Yaris", price: 300_000, status: "UNAVAILABLE", bodyType: "Hatchback" }, 3);
    await car(OWN, "cerato", { make: "Kia", model: "Cerato", price: 400_000, featuresAr: ["فتحة سقف"] }, 2);
    await car(OWN, "elantra", { make: "Hyundai", model: "Elantra", price: 420_000 }, 1);
    await car(OTHER, "otherCorolla", { price: 100_000 }, 0);

    // Saves and test-drive requests, so those two orders differ from the others.
    await db.savedCar.createMany({
      data: [
        { userId: USERS[0], carId: yaris },
        { userId: USERS[1], carId: yaris },
        { userId: USERS[0], carId: corolla },
      ],
    });
    const drive = (carId: string, userId: string) => ({ organizationId: OWN, carId, userId, date: new Date("2026-06-10"), startTime: "10:00", endTime: "11:00" });
    await db.testDrive.createMany({ data: [drive(camry, USERS[0]), drive(camry, USERS[1]), drive(yaris, USERS[0])] });
    await refreshSearchTerms();
  }, 60_000);

  afterAll(async () => {
    await cleanUp();
    await db.$disconnect();
  });

  it("finds the dealership's own cars, every status, by an Arabic make — never another dealership's", async () => {
    expect(new Set(await keys({ search: "تويوتا" }))).toEqual(new Set(["corolla", "camry", "yaris"]));
    expect(await keys({ search: "toyota" })).not.toContain("otherCorolla");
  });

  it("corrects a typo, as the buyers' search does", async () => {
    expect(await keys({ search: "corola" })).toEqual(["corolla"]);
    expect(new Set(await keys({ search: "تيوتا" }))).toEqual(new Set(["corolla", "camry", "yaris"]));
  });

  it("finds a feature by its name in the other language", async () => {
    expect(await keys({ search: "sunroof" })).toEqual(["cerato"]);
  });

  it("keeps the table's status, body type and featured filters", async () => {
    expect(await keys({ search: "toyota", status: "SOLD" })).toEqual(["camry"]);
    expect(await keys({ search: "toyota", bodyType: "Hatchback" })).toEqual(["yaris"]);
    expect(await keys({ search: "toyota", featured: true })).toEqual([]);
  });

  it("orders a search's cars exactly as the table orders them without one", async () => {
    const sorts: InventorySort[] = ["listed", "price", "saves", "drives"];
    for (const sort of sorts) {
      for (const dir of ["asc", "desc"] as const) {
        const all = await keys({ sort, dir });
        const toyotas = all.filter((key) => key === "corolla" || key === "camry" || key === "yaris");
        expect(await keys({ search: "toyota", sort, dir }), `${sort} ${dir}`).toEqual(toyotas);
      }
    }
  });

  it("pages a search, with the total of every match", async () => {
    const first = await findInventory(OWN, query({ search: "toyota", sort: "price", dir: "asc", take: 2 }));
    const second = await findInventory(OWN, query({ search: "toyota", sort: "price", dir: "asc", take: 2, skip: 2 }));
    expect(first.total).toBe(3);
    expect(second.total).toBe(3);
    expect([...first.cars, ...second.cars].map((c) => keyOf.get(c.id))).toEqual(["yaris", "corolla", "camry"]);
    expect(first.cars[0]).toMatchObject({ price: 300_000, saves: 2, testDrives: 1 });
  });

  it("lists everything without search text, and nothing for words no car has", async () => {
    expect(await keys({})).toHaveLength(5);
    expect(await keys({ search: "   " })).toHaveLength(5);
    const none = await findInventory(OWN, query({ search: "zzqx" }));
    expect(none).toEqual({ total: 0, cars: [] });
  });
});
