import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Before @/lib/prisma is imported (hoisted), so the client connects to the test database.
vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { updateSubscription, updateSubscriptionIfUnchanged } from "@/lib/repositories/billing";
import { lockSubscriptionInTx } from "@/lib/repositories/payment";
import { runInTransaction } from "@/lib/repositories/transaction";
import { db } from "@/lib/prisma";

/**
 * The two halves of the renewal-vs-settlement race, against real Postgres:
 * the daily job's compare-and-set write, and settlement's locked re-read.
 * The services' decisions are unit-tested; this pins that the SQL under them
 * does what they assume.
 */

const ORG = "org_test_subscription_cas";

describe.skipIf(!hasTestDb)("subscription compare-and-set (real Postgres)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: ORG } });
    const plan = await db.plan.upsert({
      where: { type: "PRO" },
      update: {},
      create: { name: "Pro", type: "PRO", monthlyPrice: 150_000, yearlyPrice: 1_500_000, features: {} },
    });
    await db.organization.create({ data: { id: ORG, name: "CAS Motors", slug: "cas-test", isActive: true } });
    await db.subscription.create({
      data: { organizationId: ORG, planId: plan.id, status: "ACTIVE", billingPeriod: "MONTHLY" },
    });
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: ORG } });
    await db.$disconnect();
  });

  it("writes only while the subscription is still the one read", async () => {
    const seen = await db.subscription.findUniqueOrThrow({ where: { organizationId: ORG } });

    // A payment settles in between: any write moves updatedAt.
    await new Promise((resolve) => setTimeout(resolve, 5));
    await updateSubscription(ORG, { cancelAtPeriodEnd: false, canceledAt: null });

    expect(await updateSubscriptionIfUnchanged(ORG, seen.updatedAt, { status: "PAST_DUE" })).toBe(false);
    expect(await db.subscription.findUniqueOrThrow({ where: { organizationId: ORG } })).toMatchObject({ status: "ACTIVE" });

    const fresh = await db.subscription.findUniqueOrThrow({ where: { organizationId: ORG } });
    expect(await updateSubscriptionIfUnchanged(ORG, fresh.updatedAt, { status: "PAST_DUE" })).toBe(true);
    expect(await db.subscription.findUniqueOrThrow({ where: { organizationId: ORG } })).toMatchObject({ status: "PAST_DUE" });
  });

  it("re-reads the subscription with its plan, under a row lock, inside a transaction", async () => {
    const locked = await runInTransaction((tx) => lockSubscriptionInTx(tx, ORG));
    expect(locked).toMatchObject({ organizationId: ORG, plan: { type: "PRO" } });
  });

  it("makes the job's write wait for a settlement holding the lock, then miss", async () => {
    const seen = await db.subscription.findUniqueOrThrow({ where: { organizationId: ORG } });
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));

    const settlement = runInTransaction(async (tx) => {
      await lockSubscriptionInTx(tx, ORG);
      await held;
      await tx.subscription.update({ where: { organizationId: ORG }, data: { status: "ACTIVE", pastDueSince: null } });
    });
    // The job, deciding on the row it read before the settlement committed.
    const job = updateSubscriptionIfUnchanged(ORG, seen.updatedAt, { status: "PAST_DUE" });

    await new Promise((resolve) => setTimeout(resolve, 50));
    release();
    await settlement;

    expect(await job).toBe(false);
    expect(await db.subscription.findUniqueOrThrow({ where: { organizationId: ORG } })).toMatchObject({ status: "ACTIVE" });
  });
});
