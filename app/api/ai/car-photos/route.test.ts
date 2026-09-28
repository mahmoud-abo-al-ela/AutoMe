import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimitError } from "@/lib/utils/errors";

const { resolveTenantContext, enforceDealerAiLimit, groupCarPhotos, countOrgAiCarsThisMonth } = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  enforceDealerAiLimit: vi.fn(),
  groupCarPhotos: vi.fn(),
  countOrgAiCarsThisMonth: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ resolveTenantContext }));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceDealerAiLimit }));
vi.mock("@/lib/repositories/ai-usage", () => ({ countOrgAiCarsThisMonth }));
vi.mock("@/lib/services/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/services/ai")>();
  return { ...actual, groupCarPhotos };
});

import { POST } from "@/app/api/ai/car-photos/route";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const photo = (name: string) => new File([JPEG], name, { type: "image/jpeg" });

function ctxWithAi(ai: { enabled: boolean; limit?: number }) {
  return {
    user: { id: "db-user-1" },
    userId: "clerk_user_1",
    organization: {
      id: "org-1",
      slug: "nile",
      subscription: { plan: { name: "Pro", monthlyPrice: 4900, features: { aiProcessing: ai } } },
    },
  };
}

function request(files: File[]) {
  const form = new FormData();
  for (const f of files) form.append("file", f);
  return new Request("http://localhost/api/ai/car-photos", { method: "POST", body: form });
}

beforeEach(() => {
  vi.resetAllMocks();
  resolveTenantContext.mockResolvedValue(ctxWithAi({ enabled: true, limit: 5 }));
  countOrgAiCarsThisMonth.mockResolvedValue(0);
  groupCarPhotos.mockResolvedValue([{ label: "white Elantra", photos: [0, 1], readWith: [0] }]);
});

describe("POST /api/ai/car-photos", () => {
  it("sorts the batch for the signed-in dealership, billed to its database user", async () => {
    const res = await POST(request([photo("a.jpg"), photo("b.jpg")]));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      data: { groups: [{ label: "white Elantra", photos: [0, 1], readWith: [0] }] },
    });
    expect(groupCarPhotos.mock.calls[0][0]).toHaveLength(2);
    expect(groupCarPhotos.mock.calls[0][1]).toMatchObject({ organizationId: "org-1", userId: "db-user-1" });
  });

  it("refuses a plan without AI, or with its AI listings used up, before any model call", async () => {
    resolveTenantContext.mockResolvedValue(ctxWithAi({ enabled: false }));
    expect((await (await POST(request([photo("a.jpg")]))).json()).error.code).toBe("PLAN_LIMIT_EXCEEDED");

    resolveTenantContext.mockResolvedValue(ctxWithAi({ enabled: true, limit: 5 }));
    countOrgAiCarsThisMonth.mockResolvedValue(5);
    expect((await (await POST(request([photo("a.jpg")]))).json()).error.code).toBe("PLAN_LIMIT_EXCEEDED");
    expect(groupCarPhotos).not.toHaveBeenCalled();
  });

  it("429s when rate limited", async () => {
    enforceDealerAiLimit.mockRejectedValue(new RateLimitError());
    expect((await POST(request([photo("a.jpg")]))).status).toBe(429);
  });

  it("400s more than 40 photos, none, or one that is not an image", async () => {
    const many = Array.from({ length: 41 }, (_, i) => photo(`${i}.jpg`));
    expect((await POST(request(many))).status).toBe(400);
    expect((await POST(request([]))).status).toBe(400);
    const html = new File([Buffer.from("<html></html>")], "x.jpg", { type: "image/jpeg" });
    expect((await POST(request([photo("a.jpg"), html]))).status).toBe(400);
    expect(groupCarPhotos).not.toHaveBeenCalled();
  });
});
