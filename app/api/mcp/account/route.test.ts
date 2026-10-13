import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  enforceMcpPublicLimit: vi.fn(),
  enforceMcpAccountLimit: vi.fn(),
  recordToolCall: vi.fn(),
  findUserByClerkId: vi.fn(),
  getUserWishlist: vi.fn(),
  getTestDrives: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/middleware/with-rate-limit", () => ({
  enforceMcpPublicLimit: mocks.enforceMcpPublicLimit,
  enforceMcpAccountLimit: mocks.enforceMcpAccountLimit,
  enforceMcpCostlyLimit: vi.fn(),
}));
vi.mock("@/lib/services/mcp/telemetry", () => ({ recordToolCall: mocks.recordToolCall }));
vi.mock("@/lib/repositories/user", () => ({ findUserByClerkId: mocks.findUserByClerkId }));
vi.mock("@/lib/services/wishlist", () => ({ getUserWishlist: mocks.getUserWishlist }));
vi.mock("@/lib/services/test-drive/status", () => ({ getTestDrives: mocks.getTestDrives }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { GET, POST } from "@/app/api/mcp/account/route";
import { RateLimitError } from "@/lib/utils/errors";

const METADATA = "https://auto-me.example/.well-known/oauth-protected-resource/api/mcp/account";
const HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream" };
const rpc = (method: string, params: unknown = {}) => ({ jsonrpc: "2.0", id: 1, method, params });

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new Request("https://auto-me.example/api/mcp/account", { method: "POST", headers: { ...HEADERS, ...headers }, body: JSON.stringify(body) }));

const signedIn = (userId = "user_clerk_1") => mocks.auth.mockResolvedValue({ isAuthenticated: true, userId, tokenType: "oauth_token" });
const signedOut = () => mocks.auth.mockResolvedValue({ isAuthenticated: false, tokenType: "oauth_token" });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MCP_ACCOUNT_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://auto-me.example");
  mocks.findUserByClerkId.mockResolvedValue({ id: "db-user-1", role: "USER" });
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/mcp/account", () => {
  it("is off unless switched on", async () => {
    vi.stubEnv("MCP_ACCOUNT_ENABLED", "");
    const response = await post(rpc("tools/list"));
    expect(response.status).toBe(503);
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("asks a caller without a token to sign in, pointing at the metadata", async () => {
    signedOut();
    const response = await post(rpc("tools/list"));
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe(`Bearer resource_metadata="${METADATA}"`);
    expect(mocks.auth).toHaveBeenCalledWith({ acceptsToken: "oauth_token" });
  });

  it("says invalid_token for a token that does not verify, or names an account AutoMe no longer has", async () => {
    signedOut();
    const bad = await post(rpc("tools/list"), { authorization: "Bearer forged" });
    expect(bad.status).toBe(401);
    expect(bad.headers.get("www-authenticate")).toBe(`Bearer error="invalid_token", resource_metadata="${METADATA}"`);

    signedIn("user_deleted");
    mocks.findUserByClerkId.mockResolvedValue(null);
    const gone = await post(rpc("tools/list"), { authorization: "Bearer valid" });
    expect(gone.status).toBe(401);
    expect(gone.headers.get("www-authenticate")).toContain('error="invalid_token"');
  });

  it("limits per address before checking the token, and per user after", async () => {
    mocks.enforceMcpPublicLimit.mockRejectedValueOnce(new RateLimitError("slow down"));
    expect((await post(rpc("tools/list"))).status).toBe(429);
    expect(mocks.auth).not.toHaveBeenCalled();

    signedIn();
    mocks.enforceMcpAccountLimit.mockRejectedValueOnce(new RateLimitError("slow down"));
    expect((await post(rpc("tools/list"), { authorization: "Bearer valid" })).status).toBe(429);
    expect(mocks.enforceMcpAccountLimit).toHaveBeenCalledWith("db-user-1");
  });

  it("offers the account's read tools, none of which takes a user", async () => {
    signedIn();
    const response = await post(rpc("tools/list"), { authorization: "Bearer valid" });
    const { result } = (await response.json()) as { result: { tools: { name: string; inputSchema: { properties: object }; annotations: object }[] } };
    expect(result.tools.map((tool) => tool.name)).toEqual(["list_saved_cars", "list_my_test_drives"]);
    for (const tool of result.tools) {
      expect(Object.keys(tool.inputSchema.properties)).not.toContain("userId");
      expect(tool.annotations).toMatchObject({ readOnlyHint: true });
    }
  });

  it("reads the token's own account and nobody else's", async () => {
    signedIn("user_clerk_1");
    mocks.getUserWishlist.mockResolvedValue({
      cars: [{ id: "car-1", make: "Kia", model: "Cerato", year: 2019, price: 700000, mileage: 60000, status: "AVAILABLE" }],
      pagination: { total: 1 },
    });
    const response = await post(rpc("tools/call", { name: "list_saved_cars", arguments: { userId: "someone_else" } }), { authorization: "Bearer valid" });
    const { result } = (await response.json()) as { result: { structuredContent: { cars: { id: string; url: string }[] } } };
    expect(mocks.getUserWishlist).toHaveBeenCalledWith("user_clerk_1", { page: 1, limit: 10 });
    expect(result.structuredContent.cars[0]).toMatchObject({ id: "car-1", car: "Kia Cerato", url: expect.stringContaining("/en/cars/car-1") });
  });

  it("lists the account's own test drives, filtered by status", async () => {
    signedIn("user_clerk_1");
    mocks.getTestDrives.mockResolvedValue({
      testDrives: [{ id: "td-1", status: "PENDING", date: "2026-10-15", startTime: "10:00", endTime: "11:00", notes: "private", car: { id: "car-1", make: "Kia", model: "Cerato", year: 2019 }, user: { email: "me@example.com" } }],
      pagination: { total: 1 },
    });
    const response = await post(rpc("tools/call", { name: "list_my_test_drives", arguments: { status: "pending" } }), { authorization: "Bearer valid" });
    const text = await response.text();
    expect(mocks.getTestDrives).toHaveBeenCalledWith({ status: "pending" }, { page: 1, limit: 10 }, "user_clerk_1", null);
    expect(text).toContain('"status":"PENDING"');
    expect(text).not.toMatch(/me@example\.com|private/);
  });

  it("answers GET with 405", async () => {
    expect((await GET()).status).toBe(405);
  });
});
