import { describe, it, expect, vi, beforeEach } from "vitest";

const { createMcpReferral, pruneMcpReferrals } = vi.hoisted(() => ({ createMcpReferral: vi.fn(), pruneMcpReferrals: vi.fn() }));
vi.mock("@/lib/repositories/mcp/referrals", () => ({ createMcpReferral, pruneMcpReferrals }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { mcpReferralMedium, recordMcpReferral } from "./referrals";

beforeEach(() => vi.clearAllMocks());

describe("mcpReferralMedium", () => {
  it("names the tool a visit came from, only for AutoMe's own MCP links", () => {
    expect(mcpReferralMedium({ utm_source: "mcp", utm_medium: "search_cars" })).toBe("search_cars");
    expect(mcpReferralMedium({ utm_source: ["mcp", "x"], utm_medium: ["get_car"] })).toBe("get_car");
    expect(mcpReferralMedium({ utm_source: "mcp", utm_medium: "<script>" })).toBeNull();
    expect(mcpReferralMedium({ utm_source: "newsletter", utm_medium: "search_cars" })).toBeNull();
    expect(mcpReferralMedium({})).toBeNull();
  });
});

describe("recordMcpReferral", () => {
  it("never fails the page when the write fails", async () => {
    createMcpReferral.mockRejectedValueOnce(new Error("db down"));
    await expect(recordMcpReferral("car", "car-1", "search_cars")).resolves.toBeUndefined();
  });
});
