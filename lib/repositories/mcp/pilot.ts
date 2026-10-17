// MCP pilot repository - the read-only aggregates the pilot is judged on
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

export interface ToolCallStats {
  tool: string;
  calls: number;
  p50Ms: number;
  p95Ms: number;
  /** Calls that answered a list with nothing in it. */
  zeroResults: number;
  /** Calls by error code: invalid_input, not_found, rate_limited, unavailable, internal. */
  errors: Record<string, number>;
}

export async function toolCallStats(since: Date, until: Date): Promise<ToolCallStats[]> {
  const rows = await db.$queryRaw<{ tool: string; calls: number; p50: number | null; p95: number | null; zero: number }[]>(Prisma.sql`
    SELECT "tool",
           count(*)::int AS "calls",
           percentile_cont(0.5) WITHIN GROUP (ORDER BY "durationMs")::float AS "p50",
           percentile_cont(0.95) WITHIN GROUP (ORDER BY "durationMs")::float AS "p95",
           count(*) FILTER (WHERE "resultCount" = 0 AND "errorCode" IS NULL)::int AS "zero"
    FROM "McpToolCall"
    WHERE "createdAt" >= ${since} AND "createdAt" < ${until}
    GROUP BY "tool"
    ORDER BY "calls" DESC`);
  const errorRows = await db.mcpToolCall.groupBy({
    by: ["tool", "errorCode"],
    where: { createdAt: { gte: since, lt: until }, errorCode: { not: null } },
    _count: { _all: true },
  });
  return rows.map((row) => ({
    tool: row.tool,
    calls: row.calls,
    p50Ms: Math.round(row.p50 ?? 0),
    p95Ms: Math.round(row.p95 ?? 0),
    zeroResults: row.zero,
    errors: Object.fromEntries(
      errorRows.filter((e) => e.tool === row.tool).map((e) => [e.errorCode as string, e._count._all])
    ),
  }));
}

/** Distinct callers (daily-salted IP hashes) per day — hashes never compare across days. */
export async function distinctCallersPerDay(since: Date, until: Date): Promise<{ day: string; callers: number }[]> {
  const rows = await db.$queryRaw<{ day: Date; callers: number }[]>(Prisma.sql`
    SELECT date_trunc('day', "createdAt") AS "day", count(DISTINCT "ipHash")::int AS "callers"
    FROM "McpToolCall"
    WHERE "createdAt" >= ${since} AND "createdAt" < ${until} AND "ipHash" IS NOT NULL
    GROUP BY 1
    ORDER BY 1`);
  return rows.map((row) => ({ day: row.day.toISOString().slice(0, 10), callers: row.callers }));
}

export async function callsByClient(since: Date, until: Date): Promise<{ client: string; calls: number }[]> {
  const rows = await db.mcpToolCall.groupBy({
    by: ["clientFamily"],
    where: { createdAt: { gte: since, lt: until } },
    _count: { _all: true },
    orderBy: { _count: { clientFamily: "desc" } },
  });
  return rows.map((row) => ({ client: row.clientFamily ?? "(none)", calls: row._count._all }));
}

export async function referralsByMedium(since: Date, until: Date): Promise<{ medium: string; kind: string; visits: number }[]> {
  const rows = await db.mcpReferral.groupBy({
    by: ["medium", "kind"],
    where: { createdAt: { gte: since, lt: until } },
    _count: { _all: true },
  });
  return rows
    .map((row) => ({ medium: row.medium, kind: row.kind, visits: row._count._all }))
    .sort((a, b) => b.visits - a.visits);
}
