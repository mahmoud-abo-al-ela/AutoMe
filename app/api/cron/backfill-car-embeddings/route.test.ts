import { describe, it, expect, vi, beforeEach } from "vitest";

const backfillCarEmbeddings = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/car/embedding", () => ({ backfillCarEmbeddings }));

import { GET, POST } from "./route";

const call = (query = "", auth = "Bearer s3cret") =>
  POST(new Request(`https://x/api/cron/backfill-car-embeddings${query}`, { method: "POST", headers: { authorization: auth } }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "s3cret";
});

describe("POST /api/cron/backfill-car-embeddings", () => {
  it("refuses without a configured secret, and with a wrong one", async () => {
    delete process.env.CRON_SECRET;
    expect((await call()).status).toBe(500);
    process.env.CRON_SECRET = "s3cret";
    expect((await call("", "Bearer nope")).status).toBe(401);
    expect(backfillCarEmbeddings).not.toHaveBeenCalled();
  });

  it("runs a batch and hands back the cursor", async () => {
    backfillCarEmbeddings.mockResolvedValue({ embedded: 2, next: "c2" });
    const response = await call("?limit=2&after=6b0f9d3e-7d0a-4c6e-9e44-2a1f6f3c9a01");
    expect(backfillCarEmbeddings).toHaveBeenCalledWith(2, "6b0f9d3e-7d0a-4c6e-9e44-2a1f6f3c9a01");
    expect(await response.json()).toEqual({ embedded: 2, next: "c2" });
  });

  it("answers 500 when the batch fails", async () => {
    backfillCarEmbeddings.mockRejectedValue(new Error("busy"));
    expect((await call()).status).toBe(500);
  });
});

describe("GET /api/cron/backfill-car-embeddings — the daily run", () => {
  const run = (auth = "Bearer s3cret") =>
    GET(new Request("https://x/api/cron/backfill-car-embeddings", { headers: { authorization: auth } }));

  it("refuses without the cron secret", async () => {
    expect((await run("Bearer nope")).status).toBe(401);
    expect(backfillCarEmbeddings).not.toHaveBeenCalled();
  });

  it("walks every page from the start and totals the work", async () => {
    backfillCarEmbeddings
      .mockResolvedValueOnce({ embedded: 2, next: "6b0f9d3e-7d0a-4c6e-9e44-2a1f6f3c9a01" })
      .mockResolvedValueOnce({ embedded: 1, next: null });

    const response = await run();

    expect(backfillCarEmbeddings.mock.calls).toEqual([[100, undefined], [100, "6b0f9d3e-7d0a-4c6e-9e44-2a1f6f3c9a01"]]);
    expect(await response.json()).toEqual({ embedded: 3, pages: 2, finished: true });
  });

  it("answers 500 when a page fails", async () => {
    backfillCarEmbeddings.mockRejectedValue(new Error("busy"));
    expect((await run()).status).toBe(500);
  });
});
