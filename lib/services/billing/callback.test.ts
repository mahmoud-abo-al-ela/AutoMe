import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/repositories/webhook", () => ({
  claimWebhookEvent: vi.fn(),
  releaseWebhookEvent: vi.fn(),
}));
vi.mock("@/lib/services/billing/settle", () => ({ settlePayment: vi.fn() }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/repositories/webhook";
import { settlePayment } from "@/lib/services/billing/settle";
import { handlePaymobCallback } from "@/lib/services/billing/callback";
import { transactionHmac } from "@/lib/services/paymob/hmac";
import type { PaymobTransaction } from "@/lib/services/paymob";

const SECRET = "hmac-secret";

const obj: PaymobTransaction = {
  id: 9001,
  amount_cents: 150_000,
  created_at: "2026-10-15T12:00:00.000000",
  currency: "EGP",
  success: true,
  pending: false,
  error_occured: false,
  has_parent_transaction: false,
  integration_id: 5123456,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  owner: 1,
  order: { id: 622803589, merchant_order_id: "payment-1" },
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
};

const signed = (o: PaymobTransaction) => [{ type: "TRANSACTION", obj: o }, transactionHmac(o, SECRET)] as const;

beforeEach(() => {
  vi.stubEnv("PAYMOB_API_KEY", "api");
  vi.stubEnv("PAYMOB_SECRET_KEY", "secret");
  vi.stubEnv("PAYMOB_PUBLIC_KEY", "public");
  vi.stubEnv("PAYMOB_HMAC_SECRET", SECRET);
  vi.stubEnv("PAYMOB_CARD_INTEGRATION_ID", "5123456");
  vi.mocked(claimWebhookEvent).mockResolvedValue(true);
  vi.mocked(releaseWebhookEvent).mockResolvedValue(undefined);
  vi.mocked(settlePayment).mockResolvedValue({
    status: "paid",
    paymentId: "payment-1",
    purpose: "SIGNUP",
    organizationId: "org-1",
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("handlePaymobCallback", () => {
  it("settles a signed payment, claiming the transaction once", async () => {
    const res = await handlePaymobCallback(...signed(obj));

    expect(res).toEqual({ status: 200, body: { received: true, result: "paid" } });
    expect(claimWebhookEvent).toHaveBeenCalledWith({ id: "9001:paid", provider: "paymob", type: "transaction.paid" });
    expect(settlePayment).toHaveBeenCalledWith("payment-1", obj);
  });

  it("rejects a bad signature with 401 and touches nothing", async () => {
    const [payload] = signed(obj);
    const tampered = { ...payload, obj: { ...obj, amount_cents: 1 } };

    for (const hmac of [transactionHmac(obj, SECRET), "0".repeat(128), "", null]) {
      expect((await handlePaymobCallback(tampered, hmac)).status).toBe(401);
    }
    expect((await handlePaymobCallback(payload, transactionHmac(obj, "other-secret"))).status).toBe(401);
    expect(claimWebhookEvent).not.toHaveBeenCalled();
    expect(settlePayment).not.toHaveBeenCalled();
  });

  it("fails closed when Paymob is not configured", async () => {
    vi.stubEnv("PAYMOB_HMAC_SECRET", "");
    expect((await handlePaymobCallback(...signed(obj))).status).toBe(500);
    expect(settlePayment).not.toHaveBeenCalled();
  });

  it("answers 400 to a body without a transaction", async () => {
    expect((await handlePaymobCallback({ type: "TRANSACTION" }, "x")).status).toBe(400);
    expect((await handlePaymobCallback(null, "x")).status).toBe(400);
  });

  it("acknowledges other callback types without acting", async () => {
    const res = await handlePaymobCallback({ type: "TOKEN", obj: { token: "t" } }, "x");
    expect(res.status).toBe(200);
    expect(settlePayment).not.toHaveBeenCalled();
  });

  it("acknowledges a payment AutoMe did not start", async () => {
    const res = await handlePaymobCallback(...signed({ ...obj, order: { id: 1, merchant_order_id: null } }));
    expect(res).toEqual({ status: 200, body: { received: true, ignored: "reference" } });
    expect(claimWebhookEvent).not.toHaveBeenCalled();
  });

  it("waits for a pending transaction's final callback without claiming it", async () => {
    const res = await handlePaymobCallback(...signed({ ...obj, pending: true }));
    expect(res.body).toMatchObject({ pending: true });
    expect(claimWebhookEvent).not.toHaveBeenCalled();
  });

  it("claims a failure separately from a success of the same transaction", async () => {
    await handlePaymobCallback(...signed({ ...obj, success: false }));
    expect(claimWebhookEvent).toHaveBeenCalledWith({ id: "9001:failed", provider: "paymob", type: "transaction.failed" });
  });

  it("acknowledges a repeat delivery without settling again", async () => {
    vi.mocked(claimWebhookEvent).mockResolvedValue(false);
    const res = await handlePaymobCallback(...signed(obj));
    expect(res).toEqual({ status: 200, body: { received: true, duplicate: true } });
    expect(settlePayment).not.toHaveBeenCalled();
  });

  it("releases the claim and answers 500 when settling fails, so Paymob retries", async () => {
    vi.mocked(settlePayment).mockRejectedValue(new Error("database down"));
    const res = await handlePaymobCallback(...signed(obj));
    expect(res.status).toBe(500);
    expect(releaseWebhookEvent).toHaveBeenCalledWith("9001:paid");
  });

  it("still answers 500 when the release fails too", async () => {
    vi.mocked(settlePayment).mockRejectedValue(new Error("database down"));
    vi.mocked(releaseWebhookEvent).mockRejectedValue(new Error("still down"));
    expect((await handlePaymobCallback(...signed(obj))).status).toBe(500);
  });
});
