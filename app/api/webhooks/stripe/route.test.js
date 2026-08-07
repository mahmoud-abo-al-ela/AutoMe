import { describe, it, expect, vi, beforeEach } from "vitest";
import Stripe from "stripe";

// The route captures STRIPE_WEBHOOK_SECRET and builds its Stripe client at import
// time. Vitest hoists imports and vi.mock above plain statements, so the env has
// to be set inside vi.hoisted() to run *before* the route module evaluates.
const WEBHOOK_SECRET = "whsec_test_secret";
vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
});

const { claimWebhookEvent, releaseWebhookEvent } = vi.hoisted(() => ({
  claimWebhookEvent: vi.fn(),
  releaseWebhookEvent: vi.fn(),
}));
vi.mock("@/lib/repositories/webhook", () => ({ claimWebhookEvent, releaseWebhookEvent }));

const { handleSubscriptionEvent } = vi.hoisted(() => ({ handleSubscriptionEvent: vi.fn() }));
vi.mock("@/lib/services/webhook", () => ({
  handleSubscriptionEvent,
  handleInvoicePaid: vi.fn(),
  handleInvoicePaymentFailed: vi.fn(),
  handlePaymentIntentSucceeded: vi.fn(),
  handleCheckoutSessionCompleted: vi.fn(),
}));

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));
vi.mock("next/headers", () => ({ headers: headersMock }));

import { POST } from "@/app/api/webhooks/stripe/route";

const signer = new Stripe(process.env.STRIPE_SECRET_KEY);

function event(overrides = {}) {
  return { id: "evt_1", type: "customer.subscription.updated", data: { object: {} }, ...overrides };
}

/** Build a request + sign it with the real Stripe test-header helper. */
function signedRequest(evt, { signature } = {}) {
  const payload = JSON.stringify(evt);
  const sig =
    signature === undefined
      ? signer.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET })
      : signature;
  headersMock.mockResolvedValue(new Headers(sig === null ? {} : { "stripe-signature": sig }));
  return { text: async () => payload };
}

beforeEach(() => {
  vi.clearAllMocks();
  claimWebhookEvent.mockResolvedValue(true);
  releaseWebhookEvent.mockResolvedValue(undefined);
});

describe("POST /api/webhooks/stripe", () => {
  it("rejects a request with no signature (400)", async () => {
    const res = await POST(signedRequest(event(), { signature: null }));
    expect(res.status).toBe(400);
    expect(claimWebhookEvent).not.toHaveBeenCalled();
  });

  it("rejects a forged/invalid signature (400)", async () => {
    const res = await POST(signedRequest(event(), { signature: "t=1,v1=deadbeef" }));
    expect(res.status).toBe(400);
    expect(claimWebhookEvent).not.toHaveBeenCalled();
  });

  it("acks an unknown event type as 200 without claiming a handler", async () => {
    const res = await POST(signedRequest(event({ type: "customer.updated" })));
    expect(res.status).toBe(200);
    expect(handleSubscriptionEvent).not.toHaveBeenCalled();
  });

  it("processes a verified, first-delivery event and returns 200", async () => {
    const res = await POST(signedRequest(event()));
    expect(res.status).toBe(200);
    expect(claimWebhookEvent).toHaveBeenCalledWith({
      id: "evt_1",
      provider: "stripe",
      type: "customer.subscription.updated",
    });
    expect(handleSubscriptionEvent).toHaveBeenCalledOnce();
  });

  it("acks a duplicate (claim lost) as 200 without re-running the handler", async () => {
    claimWebhookEvent.mockResolvedValue(false);
    const res = await POST(signedRequest(event()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.duplicate).toBe(true);
    expect(handleSubscriptionEvent).not.toHaveBeenCalled();
  });

  it("releases the claim and returns 500 when the handler throws", async () => {
    handleSubscriptionEvent.mockRejectedValue(new Error("boom"));
    const res = await POST(signedRequest(event()));
    expect(res.status).toBe(500);
    expect(releaseWebhookEvent).toHaveBeenCalledWith("evt_1");
  });

  it("fails closed (500) when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    vi.resetModules();
    const saved = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const mod = await import("@/app/api/webhooks/stripe/route");
      const res = await mod.POST({ text: async () => "{}" });
      expect(res.status).toBe(500);
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = saved;
      vi.resetModules();
    }
  });
});
