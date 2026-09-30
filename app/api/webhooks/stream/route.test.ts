import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";

const SECRET = "stream_test_secret";
vi.hoisted(() => {
  process.env.STREAM_API_SECRET = "stream_test_secret";
  process.env.NEXT_PUBLIC_STREAM_API_KEY = "stream_test_key";
});

const { moderateMessage } = vi.hoisted(() => ({ moderateMessage: vi.fn() }));
vi.mock("@/lib/services/chat/moderation", () => ({ moderateMessage }));
// Run `after` work inline so the test can see it.
vi.mock("next/server", () => ({ after: (fn: () => unknown) => fn() }));

import { POST } from "@/app/api/webhooks/stream/route";

function signed(event: unknown, secret = SECRET) {
  const body = JSON.stringify(event);
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  return new Request("http://localhost/api/webhooks/stream", {
    method: "POST",
    headers: { "x-signature": signature },
    body,
  });
}

const message = { id: "m1", cid: "messaging:car-1", type: "regular", text: "hi", user: { id: "u1" } };

beforeEach(() => {
  vi.clearAllMocks();
  moderateMessage.mockResolvedValue("clean");
});

describe("POST /api/webhooks/stream", () => {
  it("moderates a new or edited message from a correctly signed event", async () => {
    expect((await POST(signed({ type: "message.new", message }))).status).toBe(200);
    expect((await POST(signed({ type: "message.updated", message }))).status).toBe(200);
    expect(moderateMessage).toHaveBeenCalledTimes(2);
    expect(moderateMessage.mock.calls[0][0]).toMatchObject({ id: "m1" });
  });

  it("refuses an unsigned or wrongly signed body, and never moderates it", async () => {
    const unsigned = new Request("http://localhost/api/webhooks/stream", {
      method: "POST",
      body: JSON.stringify({ type: "message.new", message }),
    });
    expect((await POST(unsigned)).status).toBe(401);
    expect((await POST(signed({ type: "message.new", message }, "someone-elses-secret"))).status).toBe(401);
    expect(moderateMessage).not.toHaveBeenCalled();
  });

  it("acknowledges and ignores events that carry no message to check", async () => {
    expect((await POST(signed({ type: "reaction.new", message }))).status).toBe(200);
    expect((await POST(signed({ type: "channel.created" }))).status).toBe(200);
    expect(moderateMessage).not.toHaveBeenCalled();
  });

  it("answers Stream even when moderation fails — the message is already delivered", async () => {
    moderateMessage.mockRejectedValue(new Error("model down"));
    expect((await POST(signed({ type: "message.new", message }))).status).toBe(200);
  });

  it("fails closed without the secret", async () => {
    const saved = process.env.STREAM_API_SECRET;
    delete process.env.STREAM_API_SECRET;
    try {
      expect((await POST(signed({ type: "message.new", message }))).status).toBe(500);
    } finally {
      process.env.STREAM_API_SECRET = saved;
    }
    expect(moderateMessage).not.toHaveBeenCalled();
  });
});
