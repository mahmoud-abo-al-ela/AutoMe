import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { db } from "@/lib/prisma";

const ROLE = "autome_ops_ro_e2e";
const PASSWORD = randomBytes(12).toString("hex");
const FEATURE = "ops_e2e_feature";
let client: Client;
let stderr = "";
let traceId = "";

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({ name, arguments: args });
  expect(result.isError, `${name}: ${JSON.stringify(result.structuredContent)}`).toBeFalsy();
  return result.structuredContent as Record<string, unknown>;
};

describe.skipIf(!hasTestDb)("the ops MCP server over stdio, as the read-only role (real Postgres)", () => {
  beforeAll(async () => {
    await db.$executeRawUnsafe(`DROP OWNED BY ${ROLE}`).catch(() => undefined);
    await db.$executeRawUnsafe(`DROP ROLE IF EXISTS ${ROLE}`);
    await db.$executeRawUnsafe(`CREATE ROLE ${ROLE} LOGIN PASSWORD '${PASSWORD}' NOINHERIT`);
    await db.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${ROLE}`);
    await db.$executeRawUnsafe(`GRANT SELECT ON "AiUsage", "AiTrace" TO ${ROLE}`);
    await db.$executeRawUnsafe(`ALTER ROLE ${ROLE} SET default_transaction_read_only = on`);

    await db.aiUsage.deleteMany({ where: { feature: FEATURE } });
    await db.aiTrace.deleteMany({ where: { feature: FEATURE } });
    await db.aiUsage.createMany({
      data: [
        { feature: FEATURE, provider: "google", model: "gemini-test", latencyMs: 100, inputTokens: 10, outputTokens: 5 },
        { feature: FEATURE, provider: "google", model: "gemini-test", latencyMs: 900, success: false, errorCode: "TIMEOUT" },
      ],
    });
    traceId = (
      await db.aiTrace.create({
        data: { feature: FEATURE, model: "google/gemini-test", promptVersion: "1", input: "buyer asked: call 01012345678", output: null, errorCode: "INVALID_JSON" },
      })
    ).id;

    const url = new URL(process.env.TEST_DATABASE_URL!);
    url.username = ROLE;
    url.password = PASSWORD;
    const env: Record<string, string> = { OPS_MCP_ENV: "test", NODE_ENV: "test", OPS_MCP_DATABASE_URL: url.toString() };
    for (const name of ["PATH", "Path", "SystemRoot", "TEMP", "TMP", "HOME", "USERPROFILE"]) {
      if (process.env[name]) env[name] = process.env[name]!;
    }
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.resolve("node_modules/tsx/dist/cli.mjs"), "scripts/mcp/ai-ops/server.ts"],
      env,
      stderr: "pipe",
    });
    transport.stderr?.on("data", (chunk) => (stderr += String(chunk)));
    client = new Client({ name: "vitest", version: "1.0.0" });
    await client.connect(transport);
  }, 60_000);

  afterAll(async () => {
    await client?.close();
    await db.aiUsage.deleteMany({ where: { feature: FEATURE } });
    await db.aiTrace.deleteMany({ where: { feature: FEATURE } });
    await db.$executeRawUnsafe(`DROP OWNED BY ${ROLE}`);
    await db.$executeRawUnsafe(`DROP ROLE IF EXISTS ${ROLE}`);
  });

  it("starts as the read-only role and lists its seven tools", async () => {
    expect(stderr).toContain("serving over stdio as a read-only role");
    expect((await client.listTools()).tools).toHaveLength(7);
  });

  it("summarizes usage per feature and per model, with latency percentiles", async () => {
    const summary = await call("get_ai_usage_summary", { days: 1 });
    expect(summary.byFeature).toContainEqual(expect.objectContaining({ feature: FEATURE, calls: 2, failures: 1, inputTokens: 10 }));
    expect(summary.byModel).toContainEqual(expect.objectContaining({ model: "google/gemini-test", calls: 2 }));
  });

  it("lists the failures by code and the latest ones", async () => {
    const errors = await call("get_recent_ai_errors", { days: 1, limit: 100 });
    expect(errors.byCode).toContainEqual(expect.objectContaining({ errorCode: "TIMEOUT" }));
    expect(errors.recent).toContainEqual(expect.objectContaining({ feature: FEATURE, errorCode: "TIMEOUT", latencyMs: 900 }));
    expect(JSON.stringify(errors.recent)).not.toMatch(/organizationId|userId/);
  });

  it("lists and opens traces, redacted", async () => {
    const { traces } = (await call("list_recent_traces", { feature: FEATURE, errorsOnly: true })) as { traces: { id: string; input: string }[] };
    expect(traces.map((trace) => trace.id)).toEqual([traceId]);
    expect(traces[0].input).toBe("buyer asked: call [phone]");
    expect((await call("get_trace", { id: traceId })).errorCode).toBe("INVALID_JSON");
  });

  it("reads the breaker from the ledger alone, with no Redis credentials", async () => {
    const status = (await call("get_breaker_status")) as { source: string; keys: { ledger: string }[] };
    expect(status.source).toBe("ledger");
    expect(status.keys.map((key) => key.ledger)).toContain("google");
  });

  it("logged every call to stderr", () => {
    for (const tool of ["get_ai_usage_summary", "get_recent_ai_errors", "list_recent_traces", "get_trace", "get_breaker_status"]) {
      expect(stderr).toMatch(new RegExp(`ai-ops: \\S+ ${tool} .* ok \\d+ms`));
    }
    expect(stderr).not.toContain(PASSWORD);
  });
});
