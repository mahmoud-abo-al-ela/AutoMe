import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { cleanupExpiredAuditLogs } = vi.hoisted(() => ({ cleanupExpiredAuditLogs: vi.fn() }));
vi.mock("@/lib/services/audit", () => ({ cleanupExpiredAuditLogs }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { GET } from "@/app/api/cron/cleanup-audit-logs/route";

const call = (auth: string | null = "Bearer s3cret") =>
  GET(new Request("http://localhost/api/cron/cleanup-audit-logs", { headers: auth ? { authorization: auth } : {} }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "s3cret");
  cleanupExpiredAuditLogs.mockResolvedValue(3);
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/cron/cleanup-audit-logs", () => {
  it("refuses to delete anything when no secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call()).status).toBe(500);
    expect(cleanupExpiredAuditLogs).not.toHaveBeenCalled();
  });

  it("401s a wrong or missing secret", async () => {
    expect((await call("Bearer nope")).status).toBe(401);
    expect((await call(null)).status).toBe(401);
    expect(cleanupExpiredAuditLogs).not.toHaveBeenCalled();
  });

  it("deletes the expired logs and says how many", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, deletedCount: 3 });
  });

  it("answers 500 when the cleanup fails", async () => {
    cleanupExpiredAuditLogs.mockRejectedValue(new Error("db"));
    expect((await call()).status).toBe(500);
  });
});
