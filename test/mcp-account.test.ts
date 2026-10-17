import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { listMyTestDrives, listSavedCars, resolveAccountCaller, saveCar, unsaveCar } from "@/lib/services/mcp/account";
import { AuthorizationError, NotFoundError } from "@/lib/utils/errors";
import { db } from "@/lib/prisma";

const ORG = "org_test_mcp_account";
const SUSPENDED = "org_test_mcp_account_suspended";
const A = "user_test_mcp_account_a";
const B = "user_test_mcp_account_b";
/** Staff of ORG, signed in as a buyer. */
const STAFF = "user_test_mcp_account_staff";
const clerk = (id: string) => `clerk_${id}`;
const cars: Record<string, string> = {};

async function cleanUp() {
  await db.organization.deleteMany({ where: { id: { in: [ORG, SUSPENDED] } } });
  await db.user.deleteMany({ where: { id: { in: [A, B, STAFF] } } });
}

describe.skipIf(!hasTestDb)("account MCP reads (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.organization.createMany({
      data: [
        { id: ORG, name: "Account Motors", slug: "test-mcp-account", isActive: true },
        { id: SUSPENDED, name: "Gone Motors", slug: "test-mcp-account-gone", isActive: false },
      ],
    });
    await db.user.createMany({
      data: [
        { id: A, clerkId: clerk(A), email: "a@example.com" },
        { id: B, clerkId: clerk(B), email: "b@example.com" },
        { id: STAFF, clerkId: clerk(STAFF), email: "staff@example.com" },
      ],
    });
    await db.membership.create({ data: { userId: STAFF, organizationId: ORG, role: "MEMBER" } });
    const car = async (key: string, organizationId: string, make: string) => {
      cars[key] = (
        await db.car.create({
          data: {
            organizationId, make, model: "X", year: 2021, price: 900_000, mileage: 10_000,
            fuelType: "Gasoline", transmission: "Automatic", color: "White", bodyType: "Sedan",
            status: "AVAILABLE", images: [], features: [],
          },
        })
      ).id;
    };
    await car("kia", ORG, "Kia");
    await car("toyota", ORG, "Toyota");
    await car("hidden", SUSPENDED, "Hyundai");
    await db.savedCar.createMany({
      data: [
        { userId: A, carId: cars.kia },
        { userId: A, carId: cars.hidden },
        { userId: B, carId: cars.toyota },
      ],
    });
    const drive = (userId: string, carId: string, startTime: string, status: "PENDING" | "CANCELLED") => ({
      userId, carId, organizationId: ORG, date: new Date("2030-01-10T00:00:00Z"), startTime, endTime: "11:00", status, notes: `secret note of ${userId}`,
    });
    await db.testDrive.createMany({
      data: [
        drive(A, cars.kia, "10:00", "PENDING"),
        drive(A, cars.toyota, "09:00", "CANCELLED"),
        drive(B, cars.toyota, "10:00", "PENDING"),
      ],
    });
  });

  afterAll(cleanUp);

  it("knows a token's user, and no one for an unknown account", async () => {
    expect(await resolveAccountCaller(clerk(A))).toMatchObject({ id: A, clerkId: clerk(A) });
    expect(await resolveAccountCaller("clerk_nobody")).toBeNull();
  });

  it("lists only the caller's saved cars the public may still see", async () => {
    const caller = (await resolveAccountCaller(clerk(A)))!;
    const saved = await listSavedCars(caller, 1, "en");
    expect(saved.cars.map((car) => car.id)).toEqual([cars.kia]);
    expect(saved.total).toBe(1);
  });

  it("lists only the caller's test drives, by status, without notes or contact details", async () => {
    const caller = (await resolveAccountCaller(clerk(A)))!;
    const all = await listMyTestDrives(caller, "all", 1, "ar");
    expect(all.testDrives.map((drive) => drive.car?.id).sort()).toEqual([cars.kia, cars.toyota].sort());
    expect(all.testDrives[0].car?.url).toContain("/ar/cars/");

    const pending = await listMyTestDrives(caller, "pending", 1, "en");
    expect(pending.testDrives).toHaveLength(1);
    expect(pending.testDrives[0]).toMatchObject({ status: "PENDING", startTime: "10:00", car: { id: cars.kia } });
    expect(JSON.stringify(all)).not.toMatch(/secret note|@example\.com/);
  });

  const saved = (userId: string) => db.savedCar.findMany({ where: { userId }, select: { carId: true } });

  it("saves a car once however often it is asked, at once or one after the other", async () => {
    const caller = (await resolveAccountCaller(clerk(B)))!;
    const results = await Promise.all([saveCar(caller, cars.kia), saveCar(caller, cars.kia), saveCar(caller, cars.kia)]);
    expect(results.filter((r) => r.changed)).toHaveLength(1);
    expect(results.every((r) => r.saved)).toBe(true);
    expect(await saveCar(caller, cars.kia)).toEqual({ carId: cars.kia, saved: true, changed: false });
    expect((await saved(B)).map((row) => row.carId).sort()).toEqual([cars.kia, cars.toyota].sort());
  });

  it("unsaves once, and unsaving what is not saved changes nothing", async () => {
    const caller = (await resolveAccountCaller(clerk(B)))!;
    expect(await unsaveCar(caller, cars.kia)).toEqual({ carId: cars.kia, saved: false, changed: true });
    expect(await unsaveCar(caller, cars.kia)).toEqual({ carId: cars.kia, saved: false, changed: false });
  });

  it("will not save a car the public cannot see, but lets one already saved be removed", async () => {
    const caller = (await resolveAccountCaller(clerk(A)))!;
    await expect(saveCar(caller, cars.hidden)).rejects.toBeInstanceOf(NotFoundError);
    expect(await unsaveCar(caller, cars.hidden)).toMatchObject({ changed: true });
  });

  it("refuses a dealership's own staff saving its cars, as the site does", async () => {
    const staff = (await resolveAccountCaller(clerk(STAFF)))!;
    expect(staff.viewer.memberships).toEqual([{ organizationId: ORG }]);
    await expect(saveCar(staff, cars.kia)).rejects.toBeInstanceOf(AuthorizationError);
    expect(await saved(STAFF)).toEqual([]);
  });
});
