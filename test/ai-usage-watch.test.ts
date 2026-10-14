import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { findOrganizationsOverCallCount } from "@/lib/repositories/ai-usage";
import { db } from "@/lib/prisma";

/**
 * The daily AI usage watch's query (lib/services/ai/usage-watch.ts): which
 * dealerships went over the call count in the window — grouped and filtered
 * in Postgres, so only real rows can show the HAVING and the window are right.
 */
const ORGS = { busy: "org_test_usage_watch_busy", quiet: "org_test_usage_watch_quiet" };
const FEATURE = "usage_watch_test";

describe.skipIf(!hasTestDb)("AI usage watch (real Postgres)", () => {
  const since = new Date(Date.now() - 60 * 60_000);

  beforeAll(async () => {
    await db.aiUsage.deleteMany({ where: { feature: FEATURE } });
    await db.organization.deleteMany({ where: { id: { in: Object.values(ORGS) } } });
    await db.organization.createMany({
      data: [
        { id: ORGS.busy, name: "Usage Busy", slug: "usage-watch-busy", isActive: true },
        { id: ORGS.quiet, name: "Usage Quiet", slug: "usage-watch-quiet", isActive: true },
      ],
    });
    const call = (organizationId: string | null, createdAt = new Date()) => ({
      organizationId,
      feature: FEATURE,
      model: "test",
      latencyMs: 1,
      success: true,
      createdAt,
    });
    await db.aiUsage.createMany({
      data: [
        call(ORGS.busy),
        call(ORGS.busy),
        call(ORGS.busy),
        call(ORGS.quiet),
        // Outside the window: three more for the quiet one would put it over.
        call(ORGS.quiet, new Date("2020-01-01T00:00:00Z")),
        call(ORGS.quiet, new Date("2020-01-01T00:00:00Z")),
        call(ORGS.quiet, new Date("2020-01-01T00:00:00Z")),
        // Public calls belong to no dealership and are never counted against one.
        call(null),
        call(null),
        call(null),
      ],
    });
  });

  afterAll(async () => {
    await db.aiUsage.deleteMany({ where: { feature: FEATURE } });
    await db.organization.deleteMany({ where: { id: { in: Object.values(ORGS) } } });
    await db.$disconnect();
  });

  it("names only the dealerships over the count inside the window, with their calls", async () => {
    const over = (await findOrganizationsOverCallCount(since, 2)).filter((row) => Object.values(ORGS).includes(row.organizationId));

    expect(over).toEqual([{ organizationId: ORGS.busy, calls: 3 }]);
  });

  it("lists them busiest first", async () => {
    const over = (await findOrganizationsOverCallCount(since, 0)).filter((row) => Object.values(ORGS).includes(row.organizationId));

    expect(over).toEqual([
      { organizationId: ORGS.busy, calls: 3 },
      { organizationId: ORGS.quiet, calls: 1 },
    ]);
  });
});
