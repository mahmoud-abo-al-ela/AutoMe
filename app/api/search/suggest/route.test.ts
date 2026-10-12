import { describe, it, expect, vi, beforeEach } from "vitest";

const { enforceSuggestLimit, suggestSearches } = vi.hoisted(() => ({
  enforceSuggestLimit: vi.fn(),
  suggestSearches: vi.fn(),
}));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceSuggestLimit }));
vi.mock("@/lib/services/car/search-suggestions", () => ({ suggestSearches }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { GET } from "@/app/api/search/suggest/route";
import { RateLimitError, ServiceUnavailableError } from "@/lib/utils/errors";

const call = (query: string) => GET(new Request(`http://localhost/api/search/suggest${query}`));
const SUGGESTION = { kind: "make", label: "Toyota", count: 7, filters: { make: "Toyota" } };

beforeEach(() => {
  vi.resetAllMocks();
  enforceSuggestLimit.mockResolvedValue(undefined);
  suggestSearches.mockResolvedValue([SUGGESTION]);
});

describe("GET /api/search/suggest", () => {
  it("answers with the suggestions, shareable by a CDN for a minute", async () => {
    const res = await call("?q=toy&locale=en");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestions: [SUGGESTION] });
    expect(res.headers.get("cache-control")).toBe("public, s-maxage=60, stale-while-revalidate=300");
    expect(suggestSearches).toHaveBeenCalledWith("toy", "en");
  });

  it("rate-limits before doing any work", async () => {
    enforceSuggestLimit.mockRejectedValue(new RateLimitError("slow down", {}, 7));
    const res = await call("?q=toy");
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("7");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(suggestSearches).not.toHaveBeenCalled();
  });

  it("refuses, uncached, when the limiter cannot decide", async () => {
    enforceSuggestLimit.mockRejectedValue(new ServiceUnavailableError());
    const res = await call("?q=toy");
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects a missing, blank or too-long query, and an unknown language", async () => {
    for (const query of ["", "?q=", "?q=%20%20", `?q=${"a".repeat(41)}`, "?q=toy&locale=fr"]) {
      const res = await call(query);
      expect(res.status, query).toBe(400);
      expect(res.headers.get("cache-control")).toBe("no-store");
    }
    expect(suggestSearches).not.toHaveBeenCalled();
  });

  it("trims the query and defaults to English", async () => {
    await call("?q=%20%20toy%20%20");
    expect(suggestSearches).toHaveBeenCalledWith("toy", "en");
  });

  it("passes special characters through as text for the service to fold", async () => {
    await call(`?q=${encodeURIComponent("toy'; drop:* & |")}&locale=ar`);
    expect(suggestSearches).toHaveBeenCalledWith("toy'; drop:* & |", "ar");
  });

  it("takes no scope from the request: a tenant or dealership parameter changes nothing", async () => {
    await call("?q=toy&locale=en&organizationId=org-1&dealership=nile-motors");
    expect(suggestSearches).toHaveBeenCalledWith("toy", "en");
  });

  it("answers 500, uncached, when the suggestions fail", async () => {
    suggestSearches.mockRejectedValue(new Error("db"));
    const res = await call("?q=toy");
    expect(res.status).toBe(500);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
