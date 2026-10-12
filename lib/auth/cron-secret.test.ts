import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { logError } = vi.hoisted(() => ({ logError: vi.fn() }));
vi.mock("@/lib/utils/errors", () => ({ logError }));

import { refuseCronRequest } from "./cron-secret";

const request = (authorization?: string) =>
  new Request("https://example.test/api/cron/job", authorization ? { headers: { authorization } } : {});

beforeEach(() => vi.stubEnv("CRON_SECRET", "s3cret"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("refuseCronRequest", () => {
  it("lets the right secret through", () => {
    expect(refuseCronRequest(request("Bearer s3cret"), "the job")).toBeNull();
  });

  it("401s a wrong, missing or differently-sized secret", () => {
    for (const header of ["Bearer nope", undefined, "Bearer s3cret2", "s3cret", "bearer s3cret"]) {
      expect(refuseCronRequest(request(header), "the job")?.status, String(header)).toBe(401);
    }
  });

  it("fails closed when no secret is configured, and says which job it refused", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(refuseCronRequest(request("Bearer "), "the weekly summary")?.status).toBe(500);
    expect(logError).toHaveBeenCalledWith("CRON_SECRET is not configured; refusing the weekly summary");
  });
});
