import { pilotReport } from "./pilot-report";

export const MCP_TARGETS = {
  internalErrorRate: 0.01,
  unavailableRate: 0.005,
  p95Ms: 800,
} as const;

export const MIN_CALLS = 20;

export interface McpHealthBreach {
  metric: string;
  value: number;
  limit: number;
}

export interface McpHealth {
  window: { since: string; until: string };
  calls: number;
  /** False when there were too few calls to judge. */
  judged: boolean;
  breaches: McpHealthBreach[];
}

const DAY_MS = 86_400_000;

export async function mcpHealth(until: Date = new Date()): Promise<McpHealth> {
  const report = await pilotReport(new Date(until.getTime() - DAY_MS), until);
  const { calls, internalErrorRate, unavailableRate } = report.totals;
  const health = { window: report.window, calls, judged: calls >= MIN_CALLS, breaches: [] as McpHealthBreach[] };
  if (!health.judged) return health;

  if (internalErrorRate >= MCP_TARGETS.internalErrorRate) {
    health.breaches.push({ metric: "internalErrorRate", value: internalErrorRate, limit: MCP_TARGETS.internalErrorRate });
  }
  if (unavailableRate >= MCP_TARGETS.unavailableRate) {
    health.breaches.push({ metric: "unavailableRate", value: unavailableRate, limit: MCP_TARGETS.unavailableRate });
  }
  for (const tool of report.tools) {
    if (tool.calls >= MIN_CALLS && tool.p95Ms >= MCP_TARGETS.p95Ms) {
      health.breaches.push({ metric: `p95Ms:${tool.tool}`, value: tool.p95Ms, limit: MCP_TARGETS.p95Ms });
    }
  }
  return health;
}
