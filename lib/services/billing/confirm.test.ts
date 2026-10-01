import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/repositories/payment", () => ({ findPaymentSummary: vi.fn() }));
vi.mock("@/lib/services/paymob", () => ({ findTransactionByReference: vi.fn() }));
vi.mock("@/lib/services/billing/settle", () => ({ settlePayment: vi.fn() }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { findPaymentSummary, type PaymentSummary } from "@/lib/repositories/payment";
import { findTransactionByReference } from "@/lib/services/paymob";
import { settlePayment } from "@/lib/services/billing/settle";
import { confirmPayment } from "@/lib/services/billing/confirm";

const summary = (status: PaymentSummary["status"], slug: string | null = null): PaymentSummary => ({
  id: "payment-1",
  status,
  purpose: "SIGNUP",
  userId: "user-1",
  organizationId: slug ? "org-1" : null,
  periodStart: null,
  periodEnd: null,
  organization: slug ? { slug } : null,
  plan: { name: "Pro", type: "PRO" },
});

beforeEach(() => vi.clearAllMocks());

describe("confirmPayment", () => {
  it("answers from our own record once paid, without asking Paymob", async () => {
    const result = await confirmPayment(summary("PAID", "nile-motors"));
    expect(result.state).toBe("paid");
    expect(findTransactionByReference).not.toHaveBeenCalled();
  });

  it("settles from Paymob's answer when the callback has not arrived yet", async () => {
    const tx = { id: 9001 };
    vi.mocked(findTransactionByReference).mockResolvedValue(tx as never);
    vi.mocked(findPaymentSummary).mockResolvedValue(summary("PAID", "nile-motors"));

    const result = await confirmPayment(summary("PENDING"));

    expect(settlePayment).toHaveBeenCalledWith("payment-1", tx);
    expect(result).toMatchObject({ state: "paid", payment: { organization: { slug: "nile-motors" } } });
  });

  it("keeps waiting while Paymob has nothing for the payment", async () => {
    vi.mocked(findTransactionByReference).mockResolvedValue(null);
    vi.mocked(findPaymentSummary).mockResolvedValue(summary("PENDING"));
    expect((await confirmPayment(summary("PENDING"))).state).toBe("pending");
    expect(settlePayment).not.toHaveBeenCalled();
  });

  it("keeps waiting, rather than failing the page, when Paymob cannot be reached", async () => {
    vi.mocked(findTransactionByReference).mockRejectedValue(new Error("timeout"));
    vi.mocked(findPaymentSummary).mockResolvedValue(summary("PENDING"));
    expect((await confirmPayment(summary("PENDING"))).state).toBe("pending");
  });

  it("reports a declined payment", async () => {
    vi.mocked(findTransactionByReference).mockResolvedValue({ id: 9001 } as never);
    vi.mocked(findPaymentSummary).mockResolvedValue(summary("FAILED"));
    expect((await confirmPayment(summary("PENDING"))).state).toBe("failed");
  });

  it("still asks Paymob about a failed payment: a retry on Paymob's page may have paid it", async () => {
    vi.mocked(findTransactionByReference).mockResolvedValue({ id: 9002 } as never);
    vi.mocked(findPaymentSummary).mockResolvedValue(summary("PAID", "nile-motors"));
    expect((await confirmPayment(summary("FAILED"))).state).toBe("paid");
  });
});
