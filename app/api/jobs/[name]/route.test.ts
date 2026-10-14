import { describe, it, expect, vi, beforeEach } from "vitest";

const verify = vi.hoisted(() => vi.fn());
const runJob = vi.hoisted(() => vi.fn());
const isValidJobPayload = vi.hoisted(() => vi.fn());

vi.mock("@upstash/qstash", () => ({
  Receiver: class {
    verify = verify;
  },
}));
vi.mock("@/lib/jobs/registry", () => ({ isJobName: (name: string) => name === "image-alts", isValidJobPayload, runJob }));
vi.mock("@/lib/utils/errors", async (orig) => ({ ...(await orig<object>()), logError: vi.fn() }));

import { POST } from "./route";

const body = JSON.stringify({ carId: "c" });
const call = (name = "image-alts", headers: Record<string, string> = { "upstash-signature": "sig" }) =>
  POST(new Request(`https://deploy.vercel.app/api/jobs/${name}`, { method: "POST", body, headers }), {
    params: Promise.resolve({ name }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.QSTASH_CURRENT_SIGNING_KEY = "current";
  process.env.QSTASH_NEXT_SIGNING_KEY = "next";
  process.env.NEXT_PUBLIC_APP_URL = "https://autome.example";
  verify.mockResolvedValue(true);
  runJob.mockResolvedValue(undefined);
  isValidJobPayload.mockReturnValue(true);
});

/** QStash's signal to stop retrying: 489 with Upstash-NonRetryable-Error. */
const expectNotRetried = (response: Response) => {
  expect(response.status).toBe(489);
  expect(response.headers.get("Upstash-NonRetryable-Error")).toBe("true");
};

describe("POST /api/jobs/[name]", () => {
  it("refuses everything when the signing keys are missing — fail closed", async () => {
    delete process.env.QSTASH_NEXT_SIGNING_KEY;
    expect((await call()).status).toBe(500);
    expect(runJob).not.toHaveBeenCalled();
  });

  it("refuses a request without a signature, or with a bad one", async () => {
    expect((await call("image-alts", {})).status).toBe(401);
    verify.mockRejectedValue(new Error("SignatureError"));
    expect((await call()).status).toBe(401);
    expect(runJob).not.toHaveBeenCalled();
  });

  it("checks the signature over the body and the URL the job was published to", async () => {
    await call();
    expect(verify).toHaveBeenCalledWith(
      expect.objectContaining({ signature: "sig", body, url: "https://autome.example/api/jobs/image-alts" })
    );
  });

  it("runs a signed job and answers 2xx", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(runJob).toHaveBeenCalledWith("image-alts", { carId: "c" });
  });

  it("answers 500 when the job fails, so the queue retries it", async () => {
    runJob.mockRejectedValue(new Error("AI busy"));
    expect((await call()).status).toBe(500);
  });

  it("tells the queue not to retry a job that does not exist", async () => {
    expectNotRetried(await call("drop-tables"));
    expect(runJob).not.toHaveBeenCalled();
  });

  it("tells the queue not to retry a payload the job's schema refuses — it would fail every time", async () => {
    isValidJobPayload.mockReturnValue(false);
    expectNotRetried(await call());
    expect(runJob).not.toHaveBeenCalled();
  });

  it("tells the queue not to retry a body that is not JSON", async () => {
    const response = await POST(
      new Request("https://deploy.vercel.app/api/jobs/image-alts", { method: "POST", body: "{not json", headers: { "upstash-signature": "sig" } }),
      { params: Promise.resolve({ name: "image-alts" }) }
    );
    expectNotRetried(response);
  });

  it("still answers 500 (retried) when a valid job fails — an AI busy is worth another try", async () => {
    runJob.mockRejectedValue(new Error("AI busy"));
    const response = await call();
    expect(response.status).toBe(500);
    expect(response.headers.get("Upstash-NonRetryable-Error")).toBeNull();
  });
});
