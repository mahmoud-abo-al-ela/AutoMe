import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

// Point the app's Prisma client at the throwaway test database before it is
// imported. Runs in vi.hoisted so it beats the hoisted import of @/lib/prisma.
vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/repositories/webhook";
import { db } from "@/lib/prisma";

// The claim/release ledger's whole point is a genuine unique-constraint race,
// which a mocked client cannot express — so this suite needs real Postgres and
// skips cleanly when TEST_DATABASE_URL is unset (it runs in CI).
describe.skipIf(!hasTestDb)("claimWebhookEvent idempotency (real Postgres)", () => {
  beforeEach(async () => {
    await db.webhookEvent.deleteMany({ where: { id: { startsWith: "evt_test_" } } });
  });

  afterAll(async () => {
    await db.webhookEvent.deleteMany({ where: { id: { startsWith: "evt_test_" } } });
    await db.$disconnect();
  });

  it("lets exactly one of two concurrent claims for the same event id win", async () => {
    const evt = { id: "evt_test_race", provider: "stripe", type: "customer.subscription.updated" };

    const results = await Promise.all([claimWebhookEvent(evt), claimWebhookEvent(evt)]);

    // One insert wins the PK, the other collides and skips — one side effect only.
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await db.webhookEvent.count({ where: { id: evt.id } })).toBe(1);
  });

  it("treats a redelivery of the same id as a duplicate (no re-claim)", async () => {
    const evt = { id: "evt_test_dupe", provider: "stripe", type: "invoice.paid" };

    expect(await claimWebhookEvent(evt)).toBe(true);
    expect(await claimWebhookEvent(evt)).toBe(false);
  });

  it("release makes a failed event re-claimable on the provider's retry", async () => {
    const evt = { id: "evt_test_release", provider: "stripe", type: "customer.subscription.updated" };

    expect(await claimWebhookEvent(evt)).toBe(true);
    expect(await claimWebhookEvent(evt)).toBe(false); // still claimed
    await releaseWebhookEvent(evt.id); // handler failed → release
    expect(await claimWebhookEvent(evt)).toBe(true); // retry can re-process
  });
});
