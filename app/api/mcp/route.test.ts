import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { enforceMcpPublicLimit, recordToolCall } = vi.hoisted(() => ({
  enforceMcpPublicLimit: vi.fn(),
  recordToolCall: vi.fn(),
}));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceMcpPublicLimit, enforceMcpCostlyLimit: vi.fn() }));
vi.mock("@/lib/services/mcp/telemetry", () => ({ recordToolCall }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { DELETE, GET, POST } from "@/app/api/mcp/route";
import { RateLimitError, ServiceUnavailableError, ValidationError } from "@/lib/utils/errors";

const HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream" };

function rpc(method: string, params: unknown = {}, id = 1) {
  return { jsonrpc: "2.0", id, method, params };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("https://auto-me.example/api/mcp", {
      method: "POST",
      headers: { ...HEADERS, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MCP_PUBLIC_ENABLED", "true");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/mcp", () => {
  it("is off unless switched on", async () => {
    vi.stubEnv("MCP_PUBLIC_ENABLED", "");
    expect((await post(rpc("tools/list"))).status).toBe(503);
    expect(enforceMcpPublicLimit).not.toHaveBeenCalled();
  });

  it("initializes, lists and calls a tool, without sessions, never cached", async () => {
    const init = await post(
      rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "vitest", version: "1" } })
    );
    expect(init.status).toBe(200);
    expect(init.headers.get("mcp-session-id")).toBeNull();
    expect(init.headers.get("cache-control")).toBe("no-store");
    expect((await init.json()).result.serverInfo.name).toBe("autome");

    const list = await (await post(rpc("tools/list"))).json();
    expect(list.result.tools.map((tool: { name: string }) => tool.name)).toEqual(["search_cars", "get_car", "get_search_options"]);

    const call = await (await post(rpc("tools/call", { name: "get_search_options", arguments: { locale: "ar" } }))).json();
    expect(call.result.structuredContent.makes).toContainEqual({ value: "Toyota", label: "تويوتا" });
  });

  it("refuses a body over the limit, declared or not, before parsing it", async () => {
    expect((await post(rpc("tools/list"), { "content-length": String(20_000) })).status).toBe(413);
    expect(enforceMcpPublicLimit).not.toHaveBeenCalled();
    const big = JSON.stringify(rpc("tools/call", { name: "get_search_options", arguments: { pad: "x".repeat(17_000) } }));
    expect((await post(big)).status).toBe(413);
  });

  it("answers a body that is not JSON with a JSON-RPC parse error", async () => {
    const response = await post("{not json");
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe(-32700);
  });

  it("refuses when the rate limit says so, and fails closed when it cannot tell", async () => {
    enforceMcpPublicLimit.mockRejectedValueOnce(new RateLimitError("slow down", {}, 42));
    const limited = await post(rpc("tools/list"));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("42");

    enforceMcpPublicLimit.mockRejectedValueOnce(new ServiceUnavailableError());
    expect((await post(rpc("tools/list"))).status).toBe(503);

    enforceMcpPublicLimit.mockRejectedValueOnce(new ValidationError("Request denied", "request"));
    expect((await post(rpc("tools/list"))).status).toBe(403);
  });
});

describe("other methods", () => {
  it("are not allowed: no stream to open, no session to end", async () => {
    for (const handler of [GET, DELETE]) {
      const response = await handler();
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
    }
  });
});
