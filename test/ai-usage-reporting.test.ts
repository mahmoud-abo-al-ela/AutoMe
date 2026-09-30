import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import {
  getUsageByFeature,
  getUsageByModel,
  getFailuresByCode,
} from "@/lib/repositories/ai-usage";
import { db } from "@/lib/prisma";

/**
 * The reporting reads run raw SQL for the latency percentiles, which no mock
 * can check — `percentile_cont` either exists and aggregates correctly or it
 * does not. Needs real Postgres.
 */
const ORG_ID = "org_test_ai_usage";

/** Well before the window every assertion uses, so it must be excluded. */
const LONG_AGO = new Date("2020-01-01T00:00:00Z");

function since(): Date {
  return new Date(Date.now() - 60 * 60_000);
}

describe.skipIf(!hasTestDb)("AI usage reporting (real Postgres)", () => {
  beforeAll(async () => {
    await db.aiUsage.deleteMany({});
    await db.organization.deleteMany({ where: { id: ORG_ID } });
    await db.organization.create({
      data: { id: ORG_ID, name: "Usage Test", slug: "usage-test", isActive: true },
    });

    const row = (over: Record<string, unknown>) => ({
      organizationId: ORG_ID,
      feature: "carListingFromImage",
      model: "gemini-3.7-flash",
      latencyMs: 1000,
      success: true,
      ...over,
    });

    await db.aiUsage.createMany({
      data: [
        // Five successes on the main model with a wide latency spread, so a
        // mean and a p95 disagree.
        row({ latencyMs: 1000, inputTokens: 100, outputTokens: 10 }),
        row({ latencyMs: 2000, inputTokens: 100, outputTokens: 10 }),
        row({ latencyMs: 3000, inputTokens: 100, outputTokens: 10 }),
        row({ latencyMs: 4000, inputTokens: 100, outputTokens: 10 }),
        row({ latencyMs: 50_000, inputTokens: 100, outputTokens: 10 }),
        // Two failures with distinct codes.
        row({ success: false, errorCode: "HTTP_503", latencyMs: 500 }),
        row({ success: false, errorCode: "TIMEOUT", latencyMs: 20_000 }),
        // A second feature and a second model.
        row({ feature: "searchFiltersFromImage", model: "gemini-3.5-flash-lite" }),
        // Outside the window: must not appear anywhere.
        row({ createdAt: LONG_AGO, feature: "carListingFromImage" }),
      ],
    });
  });

  afterAll(async () => {
    await db.aiUsage.deleteMany({});
    await db.organization.deleteMany({ where: { id: ORG_ID } });
  });

  describe("getUsageByFeature", () => {
    it("counts calls and failures per feature, busiest first", async () => {
      const rows = await getUsageByFeature(since());

      expect(rows[0].feature).toBe("carListingFromImage");
      expect(rows[0].calls).toBe(7);
      expect(rows[0].failures).toBe(2);
    });

    it("reports a feature with no failures as zero, not missing", async () => {
      const rows = await getUsageByFeature(since());
      const search = rows.find((r) => r.feature === "searchFiltersFromImage");

      // The failure counts come from a second query; a feature absent there
      // must still report 0 rather than undefined.
      expect(search?.calls).toBe(1);
      expect(search?.failures).toBe(0);
    });

    it("sums the token columns", async () => {
      const rows = await getUsageByFeature(since());
      expect(rows[0].inputTokens).toBe(500);
      expect(rows[0].outputTokens).toBe(50);
    });

    it("excludes rows outside the window", async () => {
      const rows = await getUsageByFeature(since());
      const total = rows.reduce((sum, r) => sum + r.calls, 0);

      // Nine rows were written; one is from 2020.
      expect(total).toBe(8);
    });
  });

  describe("getUsageByModel", () => {
    it("separates the models", async () => {
      const rows = await getUsageByModel(since());
      expect(rows.map((r) => r.model)).toContain("gemini-3.5-flash-lite");
      expect(rows.map((r) => r.model)).toContain("gemini-3.7-flash");
    });

    it("computes percentiles that a mean would hide", async () => {
      const rows = await getUsageByModel(since());
      const main = rows.find((r) => r.model === "gemini-3.7-flash");

      // Latencies are 500, 1000, 2000, 3000, 4000, 20000, 50000. The mean is
      // over 11s — a duration that never actually happened — while the median
      // is 3s and the tail is what hurts.
      expect(main?.p50LatencyMs).toBe(3000);
      expect(main!.p95LatencyMs).toBeGreaterThan(20_000);
    });

    it("counts failures per model", async () => {
      const rows = await getUsageByModel(since());
      expect(rows.find((r) => r.model === "gemini-3.7-flash")?.failures).toBe(2);
    });
  });

  describe("getFailuresByCode", () => {
    it("distinguishes a saturated provider from a broken schema", async () => {
      // Both look identical in a failure rate; only the code separates them.
      const rows = await getFailuresByCode(since());
      const codes = rows.map((r) => r.errorCode);

      expect(codes).toContain("HTTP_503");
      expect(codes).toContain("TIMEOUT");
    });

    it("counts only failures", async () => {
      const rows = await getFailuresByCode(since());
      expect(rows.reduce((sum, r) => sum + r.count, 0)).toBe(2);
    });
  });
});
