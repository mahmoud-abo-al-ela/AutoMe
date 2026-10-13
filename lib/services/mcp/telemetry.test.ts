import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { createMcpToolCall, pruneMcpToolCalls } = vi.hoisted(() => ({ createMcpToolCall: vi.fn(), pruneMcpToolCalls: vi.fn() }));
vi.mock("@/lib/repositories/mcp/tool-calls", () => ({ createMcpToolCall, pruneMcpToolCalls }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { clientFamily, dailyIpHash, recordToolCall } from "./telemetry";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MCP_IP_HASH_SECRET", "s3cret");
});
afterEach(() => vi.unstubAllEnvs());

describe("dailyIpHash", () => {
  const day1 = new Date("2026-10-13T10:00:00Z");
  const day2 = new Date("2026-10-14T10:00:00Z");

  it("is stable within a day, changes the next, and never contains the address", () => {
    const hash = dailyIpHash("203.0.113.7", day1)!;
    expect(dailyIpHash("203.0.113.7", day1)).toBe(hash);
    expect(dailyIpHash("203.0.113.7", day2)).not.toBe(hash);
    expect(dailyIpHash("203.0.113.8", day1)).not.toBe(hash);
    expect(hash).not.toContain("203");
  });

  it("is nothing without a secret or an address", () => {
    expect(dailyIpHash(null, day1)).toBeNull();
    vi.stubEnv("MCP_IP_HASH_SECRET", "");
    expect(dailyIpHash("203.0.113.7", day1)).toBeNull();
  });
});

describe("clientFamily", () => {
  it("keeps a short name for the client, nothing about who uses it", () => {
    expect(clientFamily("claude-user/1.0 (+https://claude.ai)")).toBe("claude-user");
    expect(clientFamily("node")).toBe("node");
    expect(clientFamily("<script>alert(1)</script>")).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(clientFamily("")).toBeNull();
    expect(clientFamily("x".repeat(100))).toHaveLength(40);
  });
});

describe("recordToolCall", () => {
  it("stores the measures with the hashed address only", async () => {
    await recordToolCall({ tool: "search_cars", durationMs: 12.6, resultCount: 3, ip: "203.0.113.7", userAgent: "claude-user/1.0 (+https://claude.ai)" });
    const row = createMcpToolCall.mock.calls[0][0];
    expect(row).toMatchObject({ tool: "search_cars", durationMs: 13, resultCount: 3, errorCode: null, clientFamily: "claude-user" });
    expect(row.ipHash).toMatch(/^[0-9a-f]{16}$/);
    expect(JSON.stringify(row)).not.toContain("203.0.113.7");
  });

  it("never fails the answer when the write fails", async () => {
    createMcpToolCall.mockRejectedValueOnce(new Error("db down"));
    await expect(recordToolCall({ tool: "search_cars", durationMs: 1 })).resolves.toBeUndefined();
  });
});
