import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { pilotReport } from "@/lib/services/mcp/pilot-report";
import { recordMcpReferral } from "@/lib/services/mcp/referrals";
import { db } from "@/lib/prisma";

const DAY = (n: number) => new Date(Date.UTC(2099, 0, n, 12));
const SINCE = new Date(Date.UTC(2099, 0, 1));
const UNTIL = new Date(Date.UTC(2099, 0, 8));

async function cleanUp() {
  await db.mcpToolCall.deleteMany({ where: { createdAt: { gte: SINCE, lt: UNTIL } } });
  await db.mcpReferral.deleteMany({ where: { createdAt: { gte: SINCE, lt: UNTIL } } });
}

describe.skipIf(!hasTestDb)("MCP pilot report (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    const call = (tool: string, durationMs: number, extra: Record<string, unknown> = {}, day = 1) => ({
      tool, durationMs, createdAt: DAY(day), clientFamily: "claude-user", ipHash: `h${day}`, ...extra,
    });
    await db.mcpToolCall.createMany({
      data: [
        ...Array.from({ length: 10 }, (_, i) => call("search_cars", 100 + i * 10, { resultCount: i < 2 ? 0 : 5 })),
        call("search_cars", 900, { errorCode: "rate_limited" }, 2),
        call("get_car", 120, { resultCount: 1 }, 2),
        call("get_car", 130, { errorCode: "not_found" }, 2),
        call("get_car", 5000, { errorCode: "unavailable", ipHash: "other" }, 2),
        call("get_search_options", 5, { clientFamily: "node" }, 3),
      ],
    });
    await db.mcpReferral.createMany({
      data: [
        { kind: "car", target: "car-1", medium: "search_cars", createdAt: DAY(2) },
        { kind: "car", target: "car-2", medium: "search_cars", createdAt: DAY(2) },
        { kind: "dealership", target: "nile-motors", medium: "get_car", createdAt: DAY(3) },
      ],
    });
  });

  afterAll(cleanUp);

  it("counts calls, latency, errors, zero results and rate limiting per tool and overall", async () => {
    const report = await pilotReport(SINCE, UNTIL);
    expect(report.totals.calls).toBe(15);
    const search = report.tools.find((tool) => tool.tool === "search_cars")!;
    expect(search).toMatchObject({ calls: 11, zeroResults: 2, errors: { rate_limited: 1 } });
    expect(search.p50Ms).toBeGreaterThanOrEqual(140);
    expect(report.tools.find((tool) => tool.tool === "get_car")).toMatchObject({ calls: 3, errors: { not_found: 1, unavailable: 1 } });
    expect(report.totals).toMatchObject({ unavailableRate: 0.0667, rateLimitedRate: 0.0667, internalErrorRate: 0 });
    // Zero results among the list tools only: 2 of 11 search_cars calls.
    expect(report.totals.zeroResultRate).toBe(0.1818);
  });

  it("counts distinct callers per day, clients and referrals — never rows", async () => {
    const report = await pilotReport(SINCE, UNTIL);
    expect(report.callersPerDay).toEqual([
      { day: "2099-01-01", callers: 1 },
      { day: "2099-01-02", callers: 2 },
      { day: "2099-01-03", callers: 1 },
    ]);
    expect(report.clients).toEqual([{ client: "claude-user", calls: 14 }, { client: "node", calls: 1 }]);
    expect(report.totals.referrals).toBe(3);
    expect(report.referrals[0]).toEqual({ medium: "search_cars", kind: "car", visits: 2 });
  });

  it("keeps a referral", async () => {
    await recordMcpReferral("car", "car-live", "compare_cars");
    const row = await db.mcpReferral.findFirst({ where: { target: "car-live" }, orderBy: { createdAt: "desc" } });
    expect(row).toMatchObject({ kind: "car", medium: "compare_cars" });
    await db.mcpReferral.deleteMany({ where: { target: "car-live" } });
  });
});
