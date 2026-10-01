import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { runBillingRenewals } = vi.hoisted(() => ({ runBillingRenewals: vi.fn() }));
vi.mock("@/lib/services/billing/renewals", () => ({ runBillingRenewals }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { GET } from "@/app/api/cron/billing-renewals/route";

const call = (auth: string | null = "Bearer s3cret") =>
  GET(new Request("http://localhost/api/cron/billing-renewals", { headers: auth ? { authorization: auth } : {} }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "s3cret");
  runBillingRenewals.mockResolvedValue({ reminded: 2, stoppedEarly: false });
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/cron/billing-renewals", () => {
  it("refuses to run at all when no secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call()).status).toBe(500);
    expect(runBillingRenewals).not.toHaveBeenCalled();
  });

  it("401s a wrong or missing secret", async () => {
    expect((await call("Bearer nope")).status).toBe(401);
    expect((await call(null)).status).toBe(401);
    expect(runBillingRenewals).not.toHaveBeenCalled();
  });

  it("runs the job with a deadline inside the time limit and returns its report", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reminded: 2, stoppedEarly: false });
    const [, { deadline }] = runBillingRenewals.mock.calls[0];
    expect(deadline).toBeGreaterThan(Date.now());
    expect(deadline).toBeLessThan(Date.now() + 300_000);
  });

  it("answers 500 when the run fails", async () => {
    runBillingRenewals.mockRejectedValue(new Error("db"));
    expect((await call()).status).toBe(500);
  });
});
