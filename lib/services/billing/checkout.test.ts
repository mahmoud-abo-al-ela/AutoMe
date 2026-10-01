import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/repositories/billing", () => ({ findPlanById: vi.fn() }));
vi.mock("@/lib/repositories/payment", () => ({
  createPayment: vi.fn(),
  setPaymentProviderOrder: vi.fn(),
  markPaymentSetupFailed: vi.fn(),
}));
vi.mock("@/lib/services/paymob", () => ({
  paymobConfig: vi.fn(() => ({ cardIntegrationId: 5123456 })),
  createIntention: vi.fn(),
  checkoutUrl: vi.fn((secret: string) => `https://accept.paymob.com/unifiedcheckout/?clientSecret=${secret}`),
}));

import * as billingRepo from "@/lib/repositories/billing";
import * as paymentRepo from "@/lib/repositories/payment";
import * as paymob from "@/lib/services/paymob";
import { billingName, billingPhone, startCheckout, type CheckoutInput } from "@/lib/services/billing/checkout";
import { NotFoundError, ServiceUnavailableError, ValidationError } from "@/lib/utils/errors";

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

  it("fails closed without a public app URL, before recording anything", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    await expect(startCheckout(signup)).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(paymentRepo.createPayment).not.toHaveBeenCalled();
  });

  it("marks the payment failed and says so when Paymob refuses the intention", async () => {
    vi.mocked(paymob.createIntention).mockRejectedValue(new Error("Paymob /v1/intention/ failed (404)"));
    const error = await startCheckout(signup).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect((error as ServiceUnavailableError).messageKey).toBe("errors.billing.paymentSetupFailed");
    expect(paymentRepo.markPaymentSetupFailed).toHaveBeenCalledWith("payment-1");
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
