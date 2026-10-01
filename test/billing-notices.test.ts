import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";

// Point the app's Prisma client at the throwaway test database before it is
// imported. Runs in vi.hoisted so it beats the hoisted import of @/lib/prisma.
vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { db } from "@/lib/prisma";
import { claimBillingNotice, releaseBillingNotice } from "@/lib/repositories/billing";

// The daily job may run twice (a retry, a manual run) while the first is still
// sending. The ledger's unique key must let exactly one of them email.
describe.skipIf(!hasTestDb)("the billing email ledger (real Postgres)", () => {
  const slug = `notice-test-${Date.now()}`;
  let organizationId: string;
  const periodEnd = new Date("2026-10-31T22:00:00Z");

  beforeAll(async () => {
    const org = await db.organization.create({ data: { name: "Ledger Motors", slug } });
    organizationId = org.id;
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { slug } });
    await db.$disconnect();
  });

  it("lets one of two concurrent claims for the same email win", async () => {
    const results = await Promise.all([
      claimBillingNotice(organizationId, "renewal_due", periodEnd),
      claimBillingNotice(organizationId, "renewal_due", periodEnd),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("keeps each kind and each period separate", async () => {
    expect(await claimBillingNotice(organizationId, "renewal_reminder", periodEnd)).toBe(true);
    expect(await claimBillingNotice(organizationId, "renewal_due", new Date("2026-11-30T22:00:00Z"))).toBe(true);
  });

  it("can be claimed again once released", async () => {
    await releaseBillingNotice(organizationId, "renewal_due", periodEnd);
    expect(await claimBillingNotice(organizationId, "renewal_due", periodEnd)).toBe(true);
    expect(await claimBillingNotice(organizationId, "renewal_due", periodEnd)).toBe(false);
  });
});
