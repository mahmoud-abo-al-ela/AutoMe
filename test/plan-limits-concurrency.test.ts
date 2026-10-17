import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Before @/lib/prisma is imported (hoisted), so the client connects to the test database.
vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { createCarWithinLimit } from "@/lib/repositories/car";
import { createMembershipWithinLimit } from "@/lib/repositories/team";
import { db } from "@/lib/prisma";

const ORG = "org_test_plan_limits";
const USERS = Array.from({ length: 6 }, (_, i) => `user_test_plan_limits_${i}`);

const car = () => ({
  organizationId: ORG,
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  price: 500_000,
  mileage: 1,
  fuelType: "Gasoline",
  transmission: "Automatic",
  color: "White",
  bodyType: "Sedan",
  status: "AVAILABLE" as const,
  images: [],
  features: [],
});

async function cleanUp() {
  await db.organization.deleteMany({ where: { id: ORG } });
  await db.user.deleteMany({ where: { id: { in: USERS } } });
}

describe.skipIf(!hasTestDb)("plan limits under concurrency (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.organization.create({ data: { id: ORG, name: "Limits Motors", slug: "test-plan-limits", isActive: true } });
    await db.user.createMany({ data: USERS.map((id) => ({ id, clerkId: `clerk_${id}` })) });
  });
  afterAll(async () => {
    await cleanUp();
    await db.$disconnect();
  });

  it("five saves at once for the last free car place: exactly one gets it", async () => {
    await db.car.create({ data: car() }); // one of two places used

    const results = await Promise.all(Array.from({ length: 5 }, () => createCarWithinLimit(car(), 2)));

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await db.car.count({ where: { organizationId: ORG } })).toBe(2);
  });

  it("no limit (-1) lets every save in", async () => {
    const results = await Promise.all(Array.from({ length: 3 }, () => createCarWithinLimit(car(), -1)));
    expect(results.filter(Boolean)).toHaveLength(3);
  });

  it("five invites at once for the last seat: exactly one gets it", async () => {
    await db.membership.create({ data: { userId: USERS[0], organizationId: ORG, role: "OWNER" } }); // one of two seats

    const results = await Promise.all(
      USERS.slice(1).map((userId) => createMembershipWithinLimit({ userId, organizationId: ORG, role: "MEMBER" }, 2))
    );

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await db.membership.count({ where: { organizationId: ORG } })).toBe(2);
  });
});
