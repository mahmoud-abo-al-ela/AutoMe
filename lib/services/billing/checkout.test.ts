import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/repositories/billing", () => ({ findPlanById: vi.fn() }));
vi.mock("@/lib/repositories/payment", () => ({
  createPayment: vi.fn(),
  setPaymentProviderOrder: vi.fn(),
  markPaymentSetupFailed: vi.fn(),
}));
vi.mock("@/lib/services/paymob", async (importOriginal) => ({
  PaymobApiError: (await importOriginal<typeof import("@/lib/services/paymob")>()).PaymobApiError,
  paymobConfig: vi.fn(() => ({ cardIntegrationId: 5123456, walletIntegrationId: null })),
  createIntention: vi.fn(),
  checkoutUrl: vi.fn((secret: string) => `https://accept.paymob.com/unifiedcheckout/?clientSecret=${secret}`),
}));

import * as billingRepo from "@/lib/repositories/billing";
import * as paymentRepo from "@/lib/repositories/payment";
import * as paymob from "@/lib/services/paymob";
import { billingName, billingPhone, startCheckout, type CheckoutInput } from "@/lib/services/billing/checkout";
import { NotFoundError, ServiceUnavailableError, ValidationError } from "@/lib/utils/errors";
import { PaymobApiError } from "@/lib/services/paymob/http";

const pro = {
  id: "plan-pro",
  type: "PRO",
  name: "Pro",
  isActive: true,
  monthlyPrice: 150_000,
  yearlyPrice: 1_500_000,
};

const signup: CheckoutInput = {
  purpose: "SIGNUP",
  onboardingSessionId: "session-1",
  planId: "plan-pro",
  billingPeriod: "MONTHLY",
  locale: "ar",
  payer: { userId: "user-1", name: "Mona Ahmed Hassan", email: "mona@example.com" },
  dealership: { name: "Nile Motors", email: "sales@nile.example", phone: "010 0123 4567" },
};

const upgrade: CheckoutInput = {
  purpose: "UPGRADE",
  organizationId: "org-1",
  organizationSlug: "nile-motors",
  planId: "plan-pro",
  billingPeriod: "YEARLY",
  locale: "en",
  payer: { userId: "user-1", name: "Mona", email: null },
  dealership: { name: "Nile Motors", email: "sales@nile.example", phone: null },
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://autome.example/");
  vi.mocked(billingRepo.findPlanById).mockResolvedValue(pro as never);
  vi.mocked(paymentRepo.createPayment).mockResolvedValue({ id: "payment-1" } as never);
  vi.mocked(paymentRepo.setPaymentProviderOrder).mockResolvedValue(undefined);
  vi.mocked(paymentRepo.markPaymentSetupFailed).mockResolvedValue(undefined);
  vi.mocked(paymob.createIntention).mockResolvedValue({
    intentionId: "pi_test_1",
    orderId: "622803589",
    clientSecret: "egy_csk_test_1",
    offeredIntegrationIds: [5123456],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("startCheckout", () => {
  it("records a pending sign-up payment at the plan's price and opens a checkout for it", async () => {
    await expect(startCheckout(signup)).resolves.toEqual({
      paymentId: "payment-1",
      url: "https://accept.paymob.com/unifiedcheckout/?clientSecret=egy_csk_test_1",
    });

    expect(paymentRepo.createPayment).toHaveBeenCalledWith({
      purpose: "SIGNUP",
      planId: "plan-pro",
      billingPeriod: "MONTHLY",
      amountCents: 150_000,
      currency: "EGP",
      userId: "user-1",
      onboardingSessionId: "session-1",
    });
    expect(paymob.createIntention).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 150_000,
        paymentMethods: [5123456],
        specialReference: "payment-1",
        billing: {
          firstName: "Mona",
          lastName: "Ahmed Hassan",
          email: "mona@example.com",
          phoneNumber: "+201001234567",
        },
        notificationUrl: "https://autome.example/api/webhooks/paymob",
        redirectionUrl: "https://autome.example/ar/onboarding/success?ref=payment-1",
      })
    );
    expect(paymentRepo.setPaymentProviderOrder).toHaveBeenCalledWith("payment-1", "622803589");
  });

  it("charges the yearly price for an upgrade and returns to the dealership's billing page", async () => {
    await startCheckout(upgrade);

    expect(paymentRepo.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "UPGRADE", amountCents: 1_500_000, organizationId: "org-1" })
    );
    expect(paymob.createIntention).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectionUrl: "https://autome.example/en/org/nile-motors/billing/success?ref=payment-1",
        // No payer email: the dealership's; no phone: Paymob's placeholder.
        billing: { firstName: "Mona", lastName: "NA", email: "sales@nile.example", phoneNumber: "NA" },
      })
    );
  });

  it("refuses a free plan without recording anything", async () => {
    vi.mocked(billingRepo.findPlanById).mockResolvedValue({ ...pro, monthlyPrice: 0 } as never);
    await expect(startCheckout(signup)).rejects.toBeInstanceOf(ValidationError);
    expect(paymentRepo.createPayment).not.toHaveBeenCalled();
  });

  it("refuses an unknown or retired plan", async () => {
    vi.mocked(billingRepo.findPlanById).mockResolvedValue({ ...pro, isActive: false } as never);
    await expect(startCheckout(signup)).rejects.toBeInstanceOf(NotFoundError);
    vi.mocked(billingRepo.findPlanById).mockResolvedValue(null);
    await expect(startCheckout(signup)).rejects.toBeInstanceOf(NotFoundError);
    expect(paymentRepo.createPayment).not.toHaveBeenCalled();
  });

  it("fails closed without a public app URL in production, before recording anything", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    await expect(startCheckout(signup)).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(paymentRepo.createPayment).not.toHaveBeenCalled();
  });

  it("uses the local server in development when no app URL is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    await startCheckout(signup);
    expect(paymob.createIntention).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationUrl: "http://localhost:3000/api/webhooks/paymob",
        redirectionUrl: "http://localhost:3000/ar/onboarding/success?ref=payment-1",
      })
    );
  });

  it("marks the payment failed and says so when Paymob refuses the intention", async () => {
    vi.mocked(paymob.createIntention).mockRejectedValue(new Error("Paymob /v1/intention/ failed (404)"));
    const error = await startCheckout(signup).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect((error as ServiceUnavailableError).messageKey).toBe("errors.billing.paymentSetupFailed");
    expect(paymentRepo.markPaymentSetupFailed).toHaveBeenCalledWith("payment-1");
  });
});

describe("startCheckout with mobile wallets", () => {
  beforeEach(() => {
    vi.mocked(paymob.paymobConfig).mockReturnValue({ cardIntegrationId: 5123456, walletIntegrationId: 5956725 } as never);
  });

  it("offers cards and wallets together when a wallet integration is set", async () => {
    await startCheckout(signup);
    expect(paymob.createIntention).toHaveBeenCalledTimes(1);
    expect(paymob.createIntention).toHaveBeenCalledWith(expect.objectContaining({ paymentMethods: [5123456, 5956725] }));
  });

  it("falls back to cards alone when Paymob refuses the wallet integration", async () => {
    vi.mocked(paymob.createIntention)
      .mockRejectedValueOnce(new PaymobApiError("/v1/intention/", 404, "Integration ID/Name does not exist"))
      .mockResolvedValueOnce({ intentionId: "pi_2", orderId: "2", clientSecret: "egy_csk_test_2", offeredIntegrationIds: [5123456] });

    await expect(startCheckout(signup)).resolves.toMatchObject({ paymentId: "payment-1" });
    expect(vi.mocked(paymob.createIntention).mock.calls[1][0]).toMatchObject({ paymentMethods: [5123456] });
    expect(paymentRepo.markPaymentSetupFailed).not.toHaveBeenCalled();
  });

  it("does not retry other failures, or a 404 when no wallet was asked for", async () => {
    vi.mocked(paymob.createIntention).mockRejectedValue(new PaymobApiError("/v1/intention/", 500, "down"));
    await expect(startCheckout(signup)).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(paymob.createIntention).toHaveBeenCalledTimes(1);

    vi.mocked(paymob.createIntention).mockClear();
    vi.mocked(paymob.paymobConfig).mockReturnValue({ cardIntegrationId: 5123456, walletIntegrationId: null } as never);
    vi.mocked(paymob.createIntention).mockRejectedValue(new PaymobApiError("/v1/intention/", 404, "no"));
    await expect(startCheckout(signup)).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(paymob.createIntention).toHaveBeenCalledTimes(1);
  });
});

describe("billing details", () => {
  it("puts phones in international form, and Paymob's placeholder for none", () => {
    expect(billingPhone("01001234567")).toBe("+201001234567");
    expect(billingPhone("+20 100 123 4567")).toBe("+201001234567");
    expect(billingPhone("٠١٠٠١٢٣٤٥٦٧")).toBe("+201001234567");
    expect(billingPhone("")).toBe("NA");
    expect(billingPhone(null)).toBe("NA");
    expect(billingPhone("12")).toBe("NA");
  });

  it("splits a name, falling back to the dealership's", () => {
    expect(billingName("Mona", "Nile")).toEqual({ firstName: "Mona", lastName: "NA" });
    expect(billingName("  ", "Nile Motors")).toEqual({ firstName: "Nile Motors", lastName: "NA" });
  });
});
