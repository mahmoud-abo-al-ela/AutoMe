import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { refreshSearchVocabulary } = vi.hoisted(() => ({ refreshSearchVocabulary: vi.fn() }));
vi.mock("@/lib/services/car/search-vocabulary", () => ({ refreshSearchVocabulary }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { GET } from "@/app/api/cron/refresh-search-terms/route";

const call = (auth: string | null = "Bearer s3cret") =>
  GET(new Request("http://localhost/api/cron/refresh-search-terms", { headers: auth ? { authorization: auth } : {} }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "s3cret");
  refreshSearchVocabulary.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/cron/refresh-search-terms", () => {
  it("refuses to run at all when no secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call()).status).toBe(500);
    expect(refreshSearchVocabulary).not.toHaveBeenCalled();
  });

  it("401s a wrong or missing secret", async () => {
    expect((await call("Bearer nope")).status).toBe(401);
    expect((await call(null)).status).toBe(401);
    expect(refreshSearchVocabulary).not.toHaveBeenCalled();
  });

  it("refreshes the vocabulary", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ refreshed: true });
    expect(refreshSearchVocabulary).toHaveBeenCalledTimes(1);
  });

  it("answers 500 when the refresh fails", async () => {
    refreshSearchVocabulary.mockRejectedValue(new Error("db"));
    expect((await call()).status).toBe(500);
  });
});
