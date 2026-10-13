import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

const { recordToolCall, enforceMcpCostlyLimit } = vi.hoisted(() => ({
  recordToolCall: vi.fn(),
  enforceMcpCostlyLimit: vi.fn(),
}));
vi.mock("@/lib/services/mcp/telemetry", () => ({ recordToolCall }));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceMcpCostlyLimit }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { runTool, TOOL_TIMEOUT_MS, type PublicTool } from "./tool";
import { NotFoundError, RateLimitError, ValidationError } from "@/lib/utils/errors";

const CALLER = { ip: "203.0.113.7", userAgent: "claude-user/1.0" };

function tool(run: PublicTool<{ q: z.ZodString }, { n: z.ZodNumber }>["run"], costly?: boolean): PublicTool<{ q: z.ZodString }, { n: z.ZodNumber }> {
  return {
    name: "probe",
    title: "Probe",
    description: "test tool",
    inputSchema: { q: z.string() },
    outputSchema: { n: z.number() },
    costly: () => Boolean(costly),
    run,
  };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe("runTool", () => {
  it("returns the structured answer and its text twin, and records the call", async () => {
    const result = await runTool(tool(async () => ({ structured: { n: 3 }, count: 3 })), { q: "x" }, CALLER);
    expect(result).toEqual({ structuredContent: { n: 3 }, content: [{ type: "text", text: '{"n":3}' }] });
    expect(recordToolCall).toHaveBeenCalledWith(
      expect.objectContaining({ tool: "probe", resultCount: 3, errorCode: null, userAgent: "claude-user/1.0", ip: "203.0.113.7" })
    );
  });

  it("answers a failure with a fixed code only — never its message", async () => {
    for (const [error, code] of [
      [new ValidationError("limit must be 1–20 (secret detail)", "limit"), "invalid_input"],
      [new NotFoundError("Car"), "not_found"],
      [new Error("db exploded at 10.0.0.3"), "internal"],
    ] as const) {
      const result = await runTool(tool(async () => { throw error; }), { q: "x" }, CALLER);
      expect(result).toMatchObject({ isError: true, structuredContent: { error: code } });
      expect(JSON.stringify(result)).not.toMatch(/secret|10\.0\.0\.3/);
    }
    expect(recordToolCall).toHaveBeenLastCalledWith(expect.objectContaining({ errorCode: "internal" }));
  });

  it("spends the costly-call limit only on a costly call, and refuses when it is spent", async () => {
    await runTool(tool(async () => ({ structured: { n: 1 } }), false), { q: "x" }, CALLER);
    expect(enforceMcpCostlyLimit).not.toHaveBeenCalled();

    enforceMcpCostlyLimit.mockRejectedValueOnce(new RateLimitError("slow down", {}, 60));
    const run = vi.fn();
    const result = await runTool(tool(run, true), { q: "x" }, CALLER);
    expect(result).toMatchObject({ isError: true, structuredContent: { error: "rate_limited" } });
    expect(run).not.toHaveBeenCalled();
  });

  it("gives up at the time budget and says unavailable", async () => {
    vi.useFakeTimers();
    const pending = runTool(tool(() => new Promise(() => {})), { q: "x" }, CALLER);
    await vi.advanceTimersByTimeAsync(TOOL_TIMEOUT_MS + 1);
    expect(await pending).toMatchObject({ isError: true, structuredContent: { error: "unavailable" } });
  });
});
