import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import {
  transactionHmac,
  transactionHmacMessage,
  verifyTransactionHmac,
} from "@/lib/services/paymob/hmac";
import { transactionOutcome, type PaymobTransaction } from "@/lib/services/paymob/transaction";

// Paymob's worked example (developers.paymob.com, webhook callbacks → HMAC).
const example: PaymobTransaction = {
  amount_cents: 100,
  created_at: "2020-03-25T18:39:44.719228",
  currency: "EGP",
  error_occured: false,
  has_parent_transaction: false,
  id: 2556706,
  integration_id: 6741,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  order: { id: 4778239, merchant_order_id: "payment-1" },
  owner: 4705,
  pending: false,
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
  success: true,
};

const EXAMPLE_MESSAGE =
  "1002020-03-25T18:39:44.719228EGPfalsefalse25567066741truefalsefalsefalsetruefalse47782394705false2346MasterCardcardtrue";

const SECRET = "test-hmac-secret";

describe("transactionHmacMessage", () => {
  it("concatenates the twenty fields exactly as Paymob's worked example", () => {
    expect(transactionHmacMessage(example)).toBe(EXAMPLE_MESSAGE);
  });

  it("ignores fields outside the signed set, wherever they sit in the payload", () => {
    const withExtras = { zzz: 1, ...example, data: { message: "Approved" }, aaa: "x" };
    expect(transactionHmacMessage(withExtras)).toBe(EXAMPLE_MESSAGE);
  });
});

describe("verifyTransactionHmac", () => {
  const signature = createHmac("sha512", SECRET).update(EXAMPLE_MESSAGE).digest("hex");

  it("accepts Paymob's signature", () => {
    expect(transactionHmac(example, SECRET)).toBe(signature);
    expect(verifyTransactionHmac(example, signature, SECRET)).toBe(true);
  });

  it("accepts the signature in upper case", () => {
    expect(verifyTransactionHmac(example, signature.toUpperCase(), SECRET)).toBe(true);
  });

  it.each([
    ["the amount", { amount_cents: 1 }],
    ["success", { success: false }],
    ["pending", { pending: true }],
    ["the order", { order: { id: 1 } }],
    ["the card", { source_data: { pan: "0000", sub_type: "MasterCard", type: "card" } }],
  ])("rejects a payload with %s changed", (_label, change) => {
    expect(verifyTransactionHmac({ ...example, ...change }, signature, SECRET)).toBe(false);
  });

  it("rejects another secret's signature", () => {
    const other = createHmac("sha512", "another-secret").update(EXAMPLE_MESSAGE).digest("hex");
    expect(verifyTransactionHmac(example, other, SECRET)).toBe(false);
  });

  it("rejects a missing, empty or truncated signature, and an empty secret", () => {
    expect(verifyTransactionHmac(example, undefined, SECRET)).toBe(false);
    expect(verifyTransactionHmac(example, "", SECRET)).toBe(false);
    expect(verifyTransactionHmac(example, signature.slice(0, 64), SECRET)).toBe(false);
    expect(verifyTransactionHmac(example, transactionHmac(example, ""), "")).toBe(false);
  });

  it("rejects a body that is not an object", () => {
    expect(verifyTransactionHmac(null, signature, SECRET)).toBe(false);
    expect(verifyTransactionHmac("obj", signature, SECRET)).toBe(false);
  });
});

describe("transactionOutcome", () => {
  it("is paid only when successful, final, and not voided or refunded", () => {
    expect(transactionOutcome(example)).toBe("paid");
    expect(transactionOutcome({ ...example, pending: true })).toBe("pending");
    expect(transactionOutcome({ ...example, success: false })).toBe("failed");
    expect(transactionOutcome({ ...example, is_voided: true })).toBe("failed");
    expect(transactionOutcome({ ...example, is_refunded: true })).toBe("failed");
  });
});
