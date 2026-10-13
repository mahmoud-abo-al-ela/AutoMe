import {
  callsByClient,
  distinctCallersPerDay,
  referralsByMedium,
  toolCallStats,
  type ToolCallStats,
} from "@/lib/repositories/mcp/pilot";

/**
 * The public MCP pilot's numbers for a window, as plans/mcp/MCP_WEBMCP_ROADMAP.md
 * (§Pilot) defines them: latency, errors and timeouts, zero results, rate
 * limiting, reach and clicks through to AutoMe. Aggregates only.
 */

export interface PilotReport {
  window: { since: string; until: string };
  totals: {
    calls: number;
    /** Failures that are AutoMe's fault: "internal". */
    internalErrorRate: number;
    /** Timeouts and dependencies down: "unavailable". */
    unavailableRate: number;
    rateLimitedRate: number;
    /** Lists answered with nothing in them, among search_cars and list_dealerships calls. */
    zeroResultRate: number;
    referrals: number;
  };
  tools: ToolCallStats[];
  callersPerDay: { day: string; callers: number }[];
  clients: { client: string; calls: number }[];
  referrals: { medium: string; kind: string; visits: number }[];
}

const LIST_TOOLS = new Set(["search_cars", "list_dealerships"]);

const rate = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 10_000) / 10_000);

export async function pilotReport(since: Date, until: Date = new Date()): Promise<PilotReport> {
  const [tools, callersPerDay, clients, referrals] = await Promise.all([
    toolCallStats(since, until),
    distinctCallersPerDay(since, until),
    callsByClient(since, until),
    referralsByMedium(since, until),
  ]);

  const calls = tools.reduce((sum, tool) => sum + tool.calls, 0);
  const errors = (code: string) => tools.reduce((sum, tool) => sum + (tool.errors[code] ?? 0), 0);
  const lists = tools.filter((tool) => LIST_TOOLS.has(tool.tool));
  const listCalls = lists.reduce((sum, tool) => sum + tool.calls, 0);

  return {
    window: { since: since.toISOString(), until: until.toISOString() },
    totals: {
      calls,
      internalErrorRate: rate(errors("internal"), calls),
      unavailableRate: rate(errors("unavailable"), calls),
      rateLimitedRate: rate(errors("rate_limited"), calls),
      zeroResultRate: rate(lists.reduce((sum, tool) => sum + tool.zeroResults, 0), listCalls),
      referrals: referrals.reduce((sum, row) => sum + row.visits, 0),
    },
    tools,
    callersPerDay,
    clients,
    referrals,
  };
}
