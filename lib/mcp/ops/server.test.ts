import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const services = vi.hoisted(() => ({
  aiUsageSummary: vi.fn(),
  recentAiErrors: vi.fn(),
  listRecentTraces: vi.fn(),
  getTrace: vi.fn(),
  breakerSnapshot: vi.fn(),
}));
vi.mock("@/lib/services/ai-ops", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  aiUsageSummary: services.aiUsageSummary,
  recentAiErrors: services.recentAiErrors,
  listRecentTraces: services.listRecentTraces,
  getTrace: services.getTrace,
}));
vi.mock("@/lib/ai/breaker-snapshot", () => ({ breakerSnapshot: services.breakerSnapshot }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  logError: vi.fn(),
}));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createOpsMcpServer } from "./server";
import type { OpsConfig } from "./tool";

const dir = mkdtempSync(path.join(tmpdir(), "ops-server-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const REPORT = path.join(dir, "eval-report.json");
writeFileSync(
  REPORT,
  JSON.stringify({ createdAt: "2026-10-13T03:00:00Z", commit: null, suites: [{ file: "a", suiteCalls: [], cases: [{ id: "a › x", outcome: "pass", durationMs: 1, calls: [] }] }] })
);

let audit: string[] = [];

async function connect(config: Partial<OpsConfig> = {}) {
  const server = createOpsMcpServer({ redis: null, audit: (line) => audit.push(line), ...config });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "vitest", version: "1.0.0" });
  await client.connect(clientSide);
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  audit = [];
});

describe("the ops MCP server", () => {
  it("lists exactly its read-only tools, none of which takes a path, SQL or a tenant", async () => {
    const { tools } = await (await connect()).listTools();
    expect(tools.map((tool) => [tool.name, Object.keys(tool.inputSchema.properties ?? {}).sort()])).toEqual([
      ["get_ai_usage_summary", ["days"]],
      ["get_recent_ai_errors", ["days", "limit"]],
      ["get_breaker_status", []],
      ["list_recent_traces", ["errorsOnly", "feature", "limit"]],
      ["get_trace", ["id"]],
      ["get_latest_eval_report", []],
      ["compare_eval_runs", []],
    ]);
    for (const tool of tools) {
      expect(tool.annotations, tool.name).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
      expect(tool.outputSchema, tool.name).toBeDefined();
    }
  });

  it("logs one audit line per call: time, tool, arguments, outcome", async () => {
    services.aiUsageSummary.mockResolvedValue({
      since: "2026-10-06T00:00:00.000Z",
      totals: { calls: 0, failures: 0, inputTokens: 0, outputTokens: 0, thinkingTokens: 0, costMicroUsd: 0 },
      byFeature: [],
      byModel: [],
    });
    const result = await (await connect()).callTool({ name: "get_ai_usage_summary", arguments: { days: 3 } });
    expect(result.isError).toBeFalsy();
    expect(services.aiUsageSummary).toHaveBeenCalledWith(3);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatch(/^ai-ops: \d{4}-\d\d-\d\dT[\d:.]+Z get_ai_usage_summary \{"days":3\} ok \d+ms$/);
  });

  it("refuses arguments past the limits before running anything", async () => {
    const client = await connect();
    for (const [name, args] of [
      ["get_ai_usage_summary", { days: 32 }],
      ["get_recent_ai_errors", { limit: 101 }],
      ["list_recent_traces", { limit: 51 }],
      ["get_trace", { id: "../../etc/passwd" }],
    ] as const) {
      expect((await client.callTool({ name, arguments: args })).isError, name).toBe(true);
    }
    expect(services.aiUsageSummary).not.toHaveBeenCalled();
    expect(services.getTrace).not.toHaveBeenCalled();
  });

  it("reads the configured evaluation report — and no file a caller names", async () => {
    const client = await connect({ evalReport: REPORT });
    const result = await client.callTool({ name: "get_latest_eval_report", arguments: { path: "/etc/passwd", file: "C:/Windows/win.ini" } });
    expect(result.isError).toBeFalsy();
    expect((result.structuredContent as { run: { file: string } }).run.file).toBe("eval-report.json");
  });

  it("says which variable is missing when a report is not configured", async () => {
    const client = await connect({ evalReport: REPORT });
    const latest = await (await connect()).callTool({ name: "get_latest_eval_report", arguments: {} });
    expect(latest.structuredContent).toEqual({ error: "not_configured", message: "Set OPS_MCP_EVAL_REPORT when starting the ops server" });
    const compare = await client.callTool({ name: "compare_eval_runs", arguments: {} });
    expect(compare.structuredContent).toEqual({ error: "not_configured", message: "Set OPS_MCP_EVAL_PREVIOUS_REPORT when starting the ops server" });
    expect(audit.at(-1)).toMatch(/compare_eval_runs \{\} not_configured/);
  });

  it("answers an unexpected failure with a code, never its message", async () => {
    services.breakerSnapshot.mockRejectedValue(new Error("connection to postgres://user:secret@host failed"));
    const result = await (await connect()).callTool({ name: "get_breaker_status", arguments: {} });
    expect(result.structuredContent).toEqual({ error: "internal" });
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("reads the breaker with the client it was started with, and says which", async () => {
    services.breakerSnapshot.mockResolvedValue([]);
    const result = await (await connect()).callTool({ name: "get_breaker_status", arguments: {} });
    expect(services.breakerSnapshot).toHaveBeenCalledWith(null);
    expect(result.structuredContent).toEqual({ source: "ledger", keys: [] });
  });
});
