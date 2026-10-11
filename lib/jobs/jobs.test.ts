import { describe, it, expect, vi, beforeEach } from "vitest";

const publishJSON = vi.hoisted(() => vi.fn());
const refreshImageAlts = vi.hoisted(() => vi.fn());
const afterQueue = vi.hoisted(() => [] as (() => unknown)[]);

vi.mock("next/server", () => ({ after: (run: () => unknown) => afterQueue.push(run) }));
vi.mock("@upstash/qstash", () => ({
  Client: class {
    publishJSON = publishJSON;
  },
}));
vi.mock("@/lib/services/car/image-alts", () => ({ refreshImageAlts }));

import { enqueue, resetJobsForTests } from "@/lib/jobs";
import { runJob } from "@/lib/jobs/registry";

const CAR = "6b0f9d3e-7d0a-4c6e-9e44-2a1f6f3c9a01";
const payload = { carId: CAR, organizationId: "org-1", caller: { organizationId: "org-1", userId: "u-1", priority: "low" as const } };

beforeEach(() => {
  vi.clearAllMocks();
  afterQueue.length = 0;
  resetJobsForTests();
  delete process.env.QSTASH_TOKEN;
  process.env.NEXT_PUBLIC_APP_URL = "https://autome.example";
});

describe("enqueue", () => {
  it("hands the job to QStash at its own endpoint, with retries", async () => {
    process.env.QSTASH_TOKEN = "t";
    await enqueue("image-alts", payload);

    expect(publishJSON).toHaveBeenCalledWith({
      url: "https://autome.example/api/jobs/image-alts",
      body: payload,
      retries: 3,
    });
    expect(afterQueue).toHaveLength(0);
  });

  it("runs the job after the response when QStash is not configured", async () => {
    await enqueue("image-alts", payload);
    expect(publishJSON).not.toHaveBeenCalled();

    await afterQueue[0]();
    expect(refreshImageAlts).toHaveBeenCalledWith(CAR, "org-1", payload.caller, { rethrow: true });
  });

  it("runs it after the response when QStash could not reach the app (a local URL)", async () => {
    process.env.QSTASH_TOKEN = "t";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    await enqueue("image-alts", payload);
    expect(publishJSON).not.toHaveBeenCalled();
    expect(afterQueue).toHaveLength(1);
  });

  it("does the work the old way rather than drop it when the queue is down", async () => {
    process.env.QSTASH_TOKEN = "t";
    publishJSON.mockRejectedValue(new Error("qstash down"));
    await enqueue("image-alts", payload);
    expect(afterQueue).toHaveLength(1);
  });

  it("refuses a bad payload where it was written, not later in the queue", async () => {
    await expect(enqueue("image-alts", { ...payload, carId: "not-a-uuid" })).rejects.toThrow();
  });
});

describe("runJob", () => {
  it("throws when the work fails, so the queue retries it", async () => {
    refreshImageAlts.mockRejectedValue(new Error("AI busy"));
    await expect(runJob("image-alts", payload)).rejects.toThrow("AI busy");
  });
});
