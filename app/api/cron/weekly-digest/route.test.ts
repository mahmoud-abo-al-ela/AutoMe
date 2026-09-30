import { describe, it, expect, vi, beforeEach } from "vitest";

vi.hoisted(() => {
  process.env.CRON_SECRET = "cron_test_secret";
});

const { runWeeklyDigest } = vi.hoisted(() => ({ runWeeklyDigest: vi.fn() }));
vi.mock("@/lib/services/digest/weekly-digest", () => ({ runWeeklyDigest }));

import { GET } from "@/app/api/cron/weekly-digest/route";

const call = (authorization?: string) =>
  GET(
    new Request("http://localhost/api/cron/weekly-digest?at=0600", {
      headers: authorization ? { authorization } : {},
    })
  );

beforeEach(() => {
  vi.clearAllMocks();
  runWeeklyDigest.mockResolvedValue({ week: "2026-09-19", due: true, sent: 2, skipped: 0, failed: 0 });
});

describe("GET /api/cron/weekly-digest", () => {
  it("runs the weekly summary for the cron's bearer secret, with a deadline inside the time limit", async () => {
    const response = await call("Bearer cron_test_secret");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ sent: 2 });
    const [, options] = runWeeklyDigest.mock.calls[0];
    expect(options.deadline).toBeGreaterThan(Date.now());
    expect(options.deadline).toBeLessThan(Date.now() + 300_000);
  });

  it("refuses a missing or wrong secret", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
    expect(runWeeklyDigest).not.toHaveBeenCalled();
  });

  it("fails closed without CRON_SECRET", async () => {
    const saved = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    try {
      expect((await call("Bearer cron_test_secret")).status).toBe(500);
    } finally {
      process.env.CRON_SECRET = saved;
    }
    expect(runWeeklyDigest).not.toHaveBeenCalled();
  });
});
