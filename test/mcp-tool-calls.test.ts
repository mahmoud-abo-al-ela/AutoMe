import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { createMcpToolCall, pruneMcpToolCalls, MCP_TOOL_CALL_RETENTION_DAYS } from "@/lib/repositories/mcp/tool-calls";
import { db } from "@/lib/prisma";

/** The pilot's measures table (migration 20261014120000) and its retention, on real Postgres. */

const TOOL = "test_mcp_tool_calls";

describe.skipIf(!hasTestDb)("McpToolCall (real Postgres)", () => {
  beforeAll(() => db.mcpToolCall.deleteMany({ where: { tool: TOOL } }));
  afterAll(() => db.mcpToolCall.deleteMany({ where: { tool: TOOL } }));

  it("keeps a call's measures and prunes only what is past retention", async () => {
    await createMcpToolCall({ tool: TOOL, durationMs: 12, resultCount: 3, errorCode: null, clientFamily: "vitest", ipHash: "abc" });
    const old = await db.mcpToolCall.create({
      data: { tool: TOOL, durationMs: 1, createdAt: new Date(Date.now() - (MCP_TOOL_CALL_RETENTION_DAYS + 1) * 86_400_000) },
    });

    expect(await pruneMcpToolCalls()).toBeGreaterThanOrEqual(1);
    const left = await db.mcpToolCall.findMany({ where: { tool: TOOL } });
    expect(left.map((row) => row.id)).not.toContain(old.id);
    expect(left).toHaveLength(1);
    expect(left[0]).toMatchObject({ durationMs: 12, resultCount: 3, clientFamily: "vitest", ipHash: "abc" });
  });
});
