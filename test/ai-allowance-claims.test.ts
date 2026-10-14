import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Before @/lib/prisma is imported (hoisted), so the client connects to the test database.
vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { claimAiUsageForCar } from "@/lib/services/car/ai-allowance";
import { countOrgAiCarsThisMonth } from "@/lib/repositories/ai-usage";
import { DEALER_METERED_FEATURES } from "@/lib/middleware/plan-limits";
import { db } from "@/lib/prisma";
import type { TenantContext } from "@/lib/auth/context";

/**
 * The AI-listing loophole, against real Postgres: read photos for a new car,
 * re-save a car already counted this month (which used to claim that read),
 * then add the new car — which then counted nothing. An edit now claims only
 * its own calls, so the read stays for the new car.
 */

const ORG = "org_test_ai_claims";
const USER = "user_test_ai_claims";
const ctx = { user: { id: USER }, organization: { id: ORG, slug: "ai-claims" } } as unknown as TenantContext;

const meter = (feature: string, createdAt: Date) =>
  db.aiUsage.create({
    data: { organizationId: ORG, userId: USER, feature, model: "test", latencyMs: 1, success: true, createdAt },
  });

describe.skipIf(!hasTestDb)("AI allowance claims (real Postgres)", () => {
  beforeAll(async () => {
    await db.aiUsage.deleteMany({ where: { userId: USER } });
    await db.organization.deleteMany({ where: { id: ORG } });
    await db.organization.create({ data: { id: ORG, name: "AI Claims Motors", slug: "ai-claims", isActive: true } });
    await db.user.upsert({ where: { id: USER }, update: {}, create: { id: USER, clerkId: `clerk_${USER}` } });
  });
  afterAll(async () => {
    await db.aiUsage.deleteMany({ where: { userId: USER } });
    await db.organization.deleteMany({ where: { id: ORG } });
    await db.user.deleteMany({ where: { id: USER } });
    await db.$disconnect();
  });

  it("an edit of a counted car does not absorb a read made for a new car", async () => {
    // Car A was saved with AI a moment ago: counted. (Minutes, not hours, so
    // the whole story stays inside one month for the monthly count.)
    await meter("listingTranslation", new Date(Date.now() - 120_000));
    await claimAiUsageForCar(ctx, "car-a");

    // A photo read for the new car B, a minute ago.
    const read = await meter("carListingFromImage", new Date(Date.now() - 60_000));

    // Car A is edited now; its edit translates once.
    const requestStartedAt = new Date();
    await meter("listingTranslation", new Date());
    await claimAiUsageForCar(ctx, "car-a", { requestStartedAt });

    expect((await db.aiUsage.findUniqueOrThrow({ where: { id: read.id } })).carId).toBeNull();

    // Car B is added: it claims its read, and counts.
    await claimAiUsageForCar(ctx, "car-b");
    expect((await db.aiUsage.findUniqueOrThrow({ where: { id: read.id } })).carId).toBe("car-b");
    expect(await countOrgAiCarsThisMonth(ORG, DEALER_METERED_FEATURES)).toBe(2);
  });
});
