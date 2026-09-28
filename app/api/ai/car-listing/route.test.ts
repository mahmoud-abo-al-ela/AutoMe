import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationError, RateLimitError } from "@/lib/utils/errors";
import type { AiProgressEvent } from "@/lib/ai/client";

/**
 * The streaming extraction route. What is proven here: every gate refuses with
 * a real HTTP status BEFORE a stream opens or a model is called, and a
 * successful call streams real progress in order, ending in the result.
 */

const resolveTenantContext = vi.hoisted(() => vi.fn());
const enforceRateLimit = vi.hoisted(() => vi.fn());
const extractCarListing = vi.hoisted(() => vi.fn());
const countOrgAiCarsThisMonth = vi.hoisted(() => vi.fn());
const countOrgUnsavedAiCallsThisMonth = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ resolveTenantContext }));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/lib/repositories/ai-usage", () => ({ countOrgAiCarsThisMonth, countOrgUnsavedAiCallsThisMonth }));
vi.mock("@/lib/services/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/services/ai")>();
  return { ...actual, extractCarListing };
});

import { POST } from "@/app/api/ai/car-listing/route";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

function ctxWithAi(ai: { enabled: boolean; limit?: number }) {
  return {
    user: { id: "db-user-1" },
    userId: "clerk_user_1",
    organization: {
      id: "org-1",
      slug: "mo-motors",
      subscription: { plan: { name: "Starter", monthlyPrice: 0, features: { aiProcessing: ai } } },
    },
  };
}

const photo = (name = "car.jpg") => new File([JPEG], name, { type: "image/jpeg" });

function request(file: Blob | string | (Blob | string)[] = photo()) {
  const form = new FormData();
  for (const f of Array.isArray(file) ? file : [file]) form.append("file", f);
  return new Request("http://localhost/api/ai/car-listing", { method: "POST", body: form });
}

async function lines(res: Response) {
  const text = await res.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveTenantContext.mockResolvedValue(ctxWithAi({ enabled: true, limit: 5 }));
  enforceRateLimit.mockResolvedValue(undefined);
  countOrgAiCarsThisMonth.mockResolvedValue(0);
  countOrgUnsavedAiCallsThisMonth.mockResolvedValue(0);
});

describe("POST /api/ai/car-listing — refusals", () => {
  it("401s a signed-out caller", async () => {
    resolveTenantContext.mockRejectedValue(new AuthenticationError());
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(extractCarListing).not.toHaveBeenCalled();
  });

  it("refuses a plan without AI, before any model call", async () => {
    resolveTenantContext.mockResolvedValue(ctxWithAi({ enabled: false }));
    const res = await POST(request());
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect((await res.json()).error.code).toBe("PLAN_LIMIT_EXCEEDED");
    expect(extractCarListing).not.toHaveBeenCalled();
  });

  it("refuses a photo read once 5 of 5 AI listings are saved", async () => {
    countOrgAiCarsThisMonth.mockResolvedValue(5);
    const res = await POST(request());
    expect((await res.json()).error.code).toBe("PLAN_LIMIT_EXCEEDED");
    expect(extractCarListing).not.toHaveBeenCalled();
  });

  it("refuses a photo read once unsaved reads reach three per listing in the plan", async () => {
    countOrgUnsavedAiCallsThisMonth.mockResolvedValue(15); // limit 5 × 3
    const res = await POST(request());
    const body = await res.json();
    expect(body.error.code).toBe("PLAN_LIMIT_EXCEEDED");
    expect(body.error.messageKey).toBe("errors.ai.unsavedReads");
    expect(extractCarListing).not.toHaveBeenCalled();
  });

  it("does not cap unsaved reads on an unlimited plan", async () => {
    resolveTenantContext.mockResolvedValue(ctxWithAi({ enabled: true, limit: -1 }));
    countOrgUnsavedAiCallsThisMonth.mockResolvedValue(1000);
    await POST(request());
    expect(countOrgUnsavedAiCallsThisMonth).not.toHaveBeenCalled();
  });

  it("429s when rate limited", async () => {
    enforceRateLimit.mockRejectedValue(new RateLimitError());
    const res = await POST(request());
    expect(res.status).toBe(429);
  });

  it("400s a file that is not really an image", async () => {
    const html = new File([Buffer.from("<html></html>")], "car.jpg", { type: "image/jpeg" });
    const res = await POST(request(html));
    expect(res.status).toBe(400);
    expect((await res.json()).error.messageKey).toBe("errors.ai.unsupportedImage");
    expect(extractCarListing).not.toHaveBeenCalled();
  });

  it("400s a request with no file", async () => {
    const res = await POST(request("not a file"));
    expect(res.status).toBe(400);
    expect((await POST(request([]))).status).toBe(400);
  });

  it("400s more than three photos, before any model call", async () => {
    const res = await POST(request([photo("1.jpg"), photo("2.jpg"), photo("3.jpg"), photo("4.jpg")]));
    expect(res.status).toBe(400);
    expect((await res.json()).error.messageKey).toBe("errors.ai.tooManyImages");
    expect(extractCarListing).not.toHaveBeenCalled();
  });

  it("refuses the whole read when one of several photos is not an image", async () => {
    const html = new File([Buffer.from("<html></html>")], "2.jpg", { type: "image/jpeg" });
    const res = await POST(request([photo("1.jpg"), html]));
    expect(res.status).toBe(400);
    expect(extractCarListing).not.toHaveBeenCalled();
  });
});

describe("POST /api/ai/car-listing — stream", () => {
  it("streams real progress in order and ends with the result", async () => {
    extractCarListing.mockImplementation(
      async (_image: unknown, _ctx: unknown, options: { onProgress: (e: AiProgressEvent) => void }) => {
        options.onProgress({ type: "attempt", provider: "google", model: "m1", modelIndex: 0, modelCount: 3, retry: false });
        options.onProgress({ type: "attempt", provider: "google", model: "m2", modelIndex: 1, modelCount: 3, retry: false });
        options.onProgress({ type: "text", text: '{"make":"Kia"' });
        // Same count again: not re-sent.
        options.onProgress({ type: "text", text: '{"make":"Kia","mo' });
        options.onProgress({ type: "text", text: '{"make":"Kia","model":"Rio"' });
        return { make: "Kia", model: "Rio" };
      }
    );

    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");

    const events = await lines(res);
    expect(events.map((e) => e.type)).toEqual(["attempt", "attempt", "fields", "fields", "result"]);
    expect(events[1]).toMatchObject({ modelIndex: 1, modelCount: 3 });
    expect(events[2]).toMatchObject({ done: 1 });
    expect(events[3]).toMatchObject({ done: 2 });
    expect(events[4].data).toEqual({ make: "Kia", model: "Rio" });
  });

  it("reads up to three photos of the car together, in one call", async () => {
    extractCarListing.mockResolvedValue({ make: "BMW" });
    await lines(await POST(request([photo("front.jpg"), photo("back.jpg"), photo("dash.jpg")])));
    expect(extractCarListing).toHaveBeenCalledTimes(1);
    expect(extractCarListing.mock.calls[0][0]).toHaveLength(3);
  });

  it("reads with the import's lead model only when the read comes from the import", async () => {
    extractCarListing.mockResolvedValue({ make: "BMW" });
    await lines(await POST(request([photo("front.jpg")])));
    expect(extractCarListing.mock.calls[0][2].leadWith).toBeUndefined();

    const form = new FormData();
    form.append("file", photo("front.jpg"));
    form.append("purpose", "import");
    await lines(await POST(new Request("http://localhost/api/ai/car-listing", { method: "POST", body: form })));
    expect(extractCarListing.mock.calls[1][2].leadWith).toEqual([{ provider: "codecraft", model: "claude-sonnet-5" }]);
  });

  it("bills the database user, not the Clerk id, at free-plan priority", async () => {
    extractCarListing.mockResolvedValue({ make: "Kia" });
    await lines(await POST(request()));
    expect(extractCarListing.mock.calls[0][1]).toEqual({
      organizationId: "org-1",
      userId: "db-user-1",
      priority: "low",
    });
  });

  it("ends with an error line when the model call fails mid-stream", async () => {
    const { ServiceUnavailableError } = await import("@/lib/utils/errors");
    extractCarListing.mockRejectedValue(
      new ServiceUnavailableError("The AI request timed out", { key: "errors.ai.timeout" })
    );

    const events = await lines(await POST(request()));
    expect(events.at(-1)).toMatchObject({
      type: "error",
      error: { messageKey: "errors.ai.timeout" },
    });
  });
});
