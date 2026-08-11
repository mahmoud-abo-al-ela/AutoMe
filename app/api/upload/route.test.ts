import { describe, it, expect, vi, beforeEach } from "vitest";

// Auth + rate limit + the service-role client are all out of scope for this
// test: we only prove the bucket allowlist rejects an unknown destination before
// anything privileged runs.
vi.mock("@/lib/auth", () => ({
  resolveTenantContext: vi.fn().mockResolvedValue({
    organization: { id: "org-1" },
    userId: "u1",
  }),
}));
vi.mock("@/lib/middleware/with-rate-limit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(undefined),
}));

const { createAdminClient } = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ createAdminClient }));

import { POST } from "@/app/api/upload/route";
import { createAdminClient as adminClientMock } from "@/lib/supabase";

function uploadRequest(bucket: string) {
  const form = new FormData();
  form.append("bucket", bucket);
  // A valid JPEG magic-byte file, so the rejection can only be the bucket.
  form.append(
    "file",
    new File([Buffer.from([0xff, 0xd8, 0xff, 0x00])], "car.jpg", { type: "image/jpeg" }),
  );
  return new Request("http://localhost/api/upload", { method: "POST", body: form });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/upload", () => {
  it("rejects a bucket that is not on the allowlist", async () => {
    const res = await POST(uploadRequest("arbitrary-bucket"));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/bucket/i);
    // The privileged service-role client is never constructed for a bad bucket.
    expect(adminClientMock).not.toHaveBeenCalled();
  });
});
