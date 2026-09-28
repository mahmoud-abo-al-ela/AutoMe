import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { findCarsMissingImageAlts, countCarsMissingImageAlts, refreshImageAlts } = vi.hoisted(() => ({
  findCarsMissingImageAlts: vi.fn(),
  countCarsMissingImageAlts: vi.fn(),
  refreshImageAlts: vi.fn(),
}));
vi.mock("@/lib/repositories/car", () => ({ findCarsMissingImageAlts, countCarsMissingImageAlts }));
vi.mock("@/lib/services/car/image-alts", () => ({ refreshImageAlts }));

import { POST } from "@/app/api/cron/backfill-image-alts/route";

const AFTER = "0b7c9f0e-1a2b-4c3d-8e9f-a0b1c2d3e4f5";
const call = (query = "", auth: string | null = "Bearer s3cret") =>
  POST(
    new Request(`http://localhost/api/cron/backfill-image-alts${query}`, {
      method: "POST",
      headers: auth ? { authorization: auth } : {},
    })
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "s3cret");
  findCarsMissingImageAlts.mockResolvedValue([
    { id: "car-a", organizationId: "org-1" },
    { id: "car-b", organizationId: "org-2" },
  ]);
  countCarsMissingImageAlts.mockResolvedValue(7);
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/cron/backfill-image-alts", () => {
  it("refuses to run at all when no secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call()).status).toBe(500);
    expect(refreshImageAlts).not.toHaveBeenCalled();
  });

  it("401s a wrong or missing secret", async () => {
    expect((await call("", "Bearer nope")).status).toBe(401);
    expect((await call("", null)).status).toBe(401);
    expect(refreshImageAlts).not.toHaveBeenCalled();
  });

  it("400s a bad limit or cursor", async () => {
    expect((await call("?limit=500")).status).toBe(400);
    expect((await call("?after=../x")).status).toBe(400);
  });

  it("describes a batch, each car for its own dealership at low priority, and says where to go on", async () => {
    const res = await call(`?limit=2&after=${AFTER}`);
    expect(await res.json()).toEqual({ processed: 2, next: "car-b", remaining: 7 });
    expect(findCarsMissingImageAlts).toHaveBeenCalledWith({ take: 2, afterId: AFTER });
    expect(refreshImageAlts).toHaveBeenCalledWith("car-a", "org-1", { organizationId: "org-1", userId: null, priority: "low" });
    expect(refreshImageAlts).toHaveBeenCalledWith("car-b", "org-2", { organizationId: "org-2", userId: null, priority: "low" });
    expect(countCarsMissingImageAlts).toHaveBeenCalledWith("car-b");
  });

  it("reports nothing left when the walk is done", async () => {
    findCarsMissingImageAlts.mockResolvedValue([]);
    expect(await (await call()).json()).toEqual({ processed: 0, next: null, remaining: 0 });
  });
});
