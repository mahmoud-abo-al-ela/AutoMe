import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import * as carRepository from "@/lib/repositories/car";
import { findComparablePool } from "@/lib/repositories/car/queries/market";
import { findInventory } from "@/lib/repositories/dashboard/inventory";
import { findActiveOrganizationBySlug } from "@/lib/repositories/tenant";
import { getUserWishlist } from "@/lib/repositories/user/wishlist";
import { getPublicCarById } from "@/lib/services/car/storefront";
import { getBookedTimeSlots, getCarWorkingHours } from "@/lib/services/test-drive/booking";
import { NotFoundError } from "@/lib/utils/errors";
import { db } from "@/lib/prisma";
import type { CarStatus } from "@/lib/generated/prisma";

/**
 * The public visibility policy (lib/repositories/car/visibility.ts) on every
 * read path it covers, against real Postgres. Three dealerships — Active,
 * Suspended, Deleted — each with an available, a sold and an unavailable car:
 * lists show only A's available car, a car opened by id only A's available or
 * sold one, and the dealer's own dashboard still sees everything it owns.
 */

const MAKE = "Visipolmake";
const ORGS = { A: "org_test_visibility_a", S: "org_test_visibility_s", D: "org_test_visibility_d" } as const;
const USER = "user_test_visibility";
const STATUSES: CarStatus[] = ["AVAILABLE", "SOLD", "UNAVAILABLE"];
type Key = `${keyof typeof ORGS}:${CarStatus}`;

const idOf = {} as Record<Key, string>;
const keyOf = new Map<string, Key>();
// The serializers type their rows as nullable; a real row never is.
const keys = (rows: ({ id: string } | null)[]) => rows.map((row) => row && keyOf.get(row.id)).filter(Boolean).sort();
const LISTED: Key[] = ["A:AVAILABLE"];
const OPENED: Key[] = ["A:AVAILABLE", "A:SOLD"];

async function cleanUp() {
  await db.organization.deleteMany({ where: { id: { in: Object.values(ORGS) } } });
  await db.user.deleteMany({ where: { id: USER } });
}

describe.skipIf(!hasTestDb)("public visibility (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.organization.createMany({
      data: [
        { id: ORGS.A, name: "Visibility Active", slug: "test-visibility-a", isActive: true },
        { id: ORGS.S, name: "Visibility Suspended", slug: "test-visibility-s", isActive: false },
        { id: ORGS.D, name: "Visibility Deleted", slug: "test-visibility-d", isActive: true, deletedAt: new Date() },
      ],
    });
    await db.user.create({ data: { id: USER, clerkId: `clerk_${USER}` } });

    let price = 400_000;
    for (const [org, organizationId] of Object.entries(ORGS) as [keyof typeof ORGS, string][]) {
      for (const status of STATUSES) {
        const key: Key = `${org}:${status}`;
        const car = await db.car.create({
          data: {
            organizationId,
            make: MAKE,
            model: key.replace(":", "_"),
            year: 2020,
            price: (price += 1_000),
            mileage: 10_000,
            fuelType: "Gasoline",
            transmission: "Automatic",
            color: "White",
            bodyType: "Sedan",
            status,
            images: [],
            features: [],
          },
        });
        idOf[key] = car.id;
        keyOf.set(car.id, key);
        await db.savedCar.create({ data: { userId: USER, carId: car.id } });
      }
    }
  });

  afterAll(cleanUp);

  describe("lists, counts and prices: only an active dealership's available cars", () => {
    it("the marketplace listing, with and without words", async () => {
      expect(keys((await carRepository.findManyCars({ make: [MAKE] }, { limit: 50 })).cars)).toEqual(LISTED);
      expect(keys((await carRepository.findManyCars({ search: MAKE }, { limit: 50 })).cars)).toEqual(LISTED);
    });

    it("a storefront: a suspended or deleted dealership's own scope shows nothing", async () => {
      for (const org of ["S", "D"] as const) {
        expect((await carRepository.findManyCars({ organizationId: ORGS[org] }, { limit: 50 })).cars).toEqual([]);
        expect((await carRepository.findManyCars({ organizationId: ORGS[org], search: MAKE }, { limit: 50 })).cars).toEqual([]);
      }
      expect(keys((await carRepository.findManyCars({ organizationId: ORGS.A }, { limit: 50 })).cars)).toEqual(LISTED);
    });

    it("the filter panel's counts and the suggestions' counts", async () => {
      // Facets are counted for a search with words (getFilterOptions), as here.
      expect((await carRepository.searchFacets({ search: MAKE })).total).toBe(1);
      for (const org of ["S", "D"] as const) {
        expect((await carRepository.searchFacets({ search: MAKE, organizationId: ORGS[org] })).total).toBe(0);
      }
      const pairs = (await carRepository.countPublicMakeModels()).filter((pair) => pair.make === MAKE);
      expect(pairs.map((pair) => pair.model)).toEqual(["A_AVAILABLE"]);
    });

    it("the market numbers and the price comparisons", async () => {
      expect((await carRepository.getMarketSummary({ organizationId: ORGS.S, currency: "EGP" })).listings).toBe(0);
      expect((await carRepository.getMarketSummary({ organizationId: ORGS.A, currency: "EGP" })).listings).toBe(1);
      const prices = await carRepository.findComparablePrices({
        make: MAKE, model: undefined, bodyType: undefined, year: 2020, yearSpan: 0,
        excludeCarId: "00000000-0000-0000-0000-000000000000", currency: "EGP",
      });
      expect(prices).toHaveLength(1);
      const pool = await findComparablePool({ makes: [MAKE], minYear: 2020, maxYear: 2020, yearSpan: 0, currency: "EGP" });
      expect(keys(pool)).toEqual(LISTED);
    });
  });

  describe("a car opened by id: available or sold, of an active dealership", () => {
    it("the car page, compare and the assistant agree", async () => {
      for (const key of Object.keys(idOf) as Key[]) {
        const visible = OPENED.includes(key);
        expect(Boolean(await carRepository.findPublicCarById(idOf[key])), key).toBe(visible);
        expect(Boolean(await carRepository.findCarForAssistant(idOf[key])), key).toBe(visible);
      }
      expect(keys(await carRepository.findPublicCarsByIds(Object.values(idOf)))).toEqual(OPENED);
    });

    it("a hidden car is not found, exactly like an id that never existed", async () => {
      for (const id of [idOf["S:AVAILABLE"], idOf["D:SOLD"], idOf["A:UNAVAILABLE"], "00000000-0000-0000-0000-000000000000"]) {
        await expect(getPublicCarById(id)).rejects.toBeInstanceOf(NotFoundError);
        await expect(getCarWorkingHours(id)).rejects.toBeInstanceOf(NotFoundError);
        await expect(getBookedTimeSlots(id, "2026-10-20")).rejects.toBeInstanceOf(NotFoundError);
      }
      expect((await getPublicCarById(idOf["A:SOLD"])).status).toBe("SOLD");
    });

    it("a saved list keeps only the cars that can be opened", async () => {
      expect(keys((await getUserWishlist(USER, { limit: 50 })).cars)).toEqual(OPENED);
    });
  });

  describe("storefronts and the dealer's own view", () => {
    it("a suspended or deleted dealership has no storefront", async () => {
      expect(await findActiveOrganizationBySlug("test-visibility-a")).not.toBeNull();
      expect(await findActiveOrganizationBySlug("test-visibility-s")).toBeNull();
      expect(await findActiveOrganizationBySlug("test-visibility-d")).toBeNull();
    });

    it("the dashboard still sees every car the dealership owns, whatever its status", async () => {
      const query = { sort: "listed", dir: "desc", skip: 0, take: 50 } as const;
      for (const org of ["A", "S"] as const) {
        expect((await findInventory(ORGS[org], query)).cars).toHaveLength(3);
        expect((await findInventory(ORGS[org], { ...query, search: MAKE })).cars).toHaveLength(3);
      }
      // The dealer's editor reads a car whatever its status.
      expect(await carRepository.findCarById(idOf["A:UNAVAILABLE"])).not.toBeNull();
    });
  });
});
