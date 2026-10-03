import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { paymobConfig } from "@/lib/services/paymob/config";
import { checkoutUrl, createIntention, type IntentionInput } from "@/lib/services/paymob/intention";
import { findTransactionByReference } from "@/lib/services/paymob/inquiry";
import { refundTransaction } from "@/lib/services/paymob/refund";
import { PaymobApiError } from "@/lib/services/paymob/http";
import { ServiceUnavailableError } from "@/lib/utils/errors";

const ENV = {
  PAYMOB_API_KEY: "api-key",
  PAYMOB_SECRET_KEY: "egy_sk_test_secret",
  PAYMOB_PUBLIC_KEY: "egy_pk_test_public",
  PAYMOB_HMAC_SECRET: "hmac-secret",
  PAYMOB_CARD_INTEGRATION_ID: "5123456",
  PAYMOB_WALLET_INTEGRATION_ID: "",
};

const json = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  for (const [name, value] of Object.entries(ENV)) vi.stubEnv(name, value);
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const call = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit];
  return { url, init, body: init.body ? JSON.parse(String(init.body)) : undefined };
};

describe("paymobConfig", () => {
  it("reads the credentials, with no wallet integration until one is set", () => {
    expect(paymobConfig()).toEqual({
      apiKey: "api-key",
      secretKey: "egy_sk_test_secret",
      publicKey: "egy_pk_test_public",
      hmacSecret: "hmac-secret",
      cardIntegrationId: 5123456,
      walletIntegrationId: null,
    });
  });

  it("fails closed, naming every missing variable", () => {
    vi.stubEnv("PAYMOB_HMAC_SECRET", "");
    vi.stubEnv("PAYMOB_SECRET_KEY", "  ");
    expect(() => paymobConfig()).toThrow(ServiceUnavailableError);
    expect(() => paymobConfig()).toThrow(/PAYMOB_SECRET_KEY, PAYMOB_HMAC_SECRET/);
  });

  it("refuses an integration ID that is not a number", () => {
    vi.stubEnv("PAYMOB_CARD_INTEGRATION_ID", "card");
    expect(() => paymobConfig()).toThrow(/PAYMOB_CARD_INTEGRATION_ID/);
  });
});

describe("createIntention", () => {
  const input: IntentionInput = {
    amountCents: 150_000,
    currency: "EGP",
    paymentMethods: [5123456],
    items: [{ name: "Pro — monthly", amountCents: 150_000 }],
    billing: { firstName: "Mona", lastName: "Hassan", email: "mona@example.com", phoneNumber: "+201001234567" },
    specialReference: "payment-1",
    notificationUrl: "https://autome.example/api/webhooks/paymob",
    redirectionUrl: "https://autome.example/ar/onboarding/success?ref=payment-1",
  };

  it("posts the intention with the secret key and maps the answer", async () => {
    fetchMock.mockResolvedValue(
      json(201, {
        id: "pi_test_abc",
        intention_order_id: 622803589,
        client_secret: "egy_csk_test_xyz",
        payment_methods: [{ integration_id: 5123456, method_type: "online" }],
      })
    );

    await expect(createIntention(input)).resolves.toEqual({
      intentionId: "pi_test_abc",
      orderId: "622803589",
      clientSecret: "egy_csk_test_xyz",
      offeredIntegrationIds: [5123456],
    });

    const { url, init, body } = call();
    expect(url).toBe("https://accept.paymob.com/v1/intention/");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Token egy_sk_test_secret");
    expect(body).toMatchObject({
      amount: 150_000,
      currency: "EGP",
      payment_methods: [5123456],
      items: [{ name: "Pro — monthly", amount: 150_000, quantity: 1 }],
      billing_data: { phone_number: "+201001234567", email: "mona@example.com", country: "EGY" },
      special_reference: "payment-1",
      notification_url: "https://autome.example/api/webhooks/paymob",
      redirection_url: "https://autome.example/ar/onboarding/success?ref=payment-1",
    });
  });

  it("surfaces Paymob's error without the credentials", async () => {
    fetchMock.mockResolvedValue(json(404, { detail: "Integration ID/Name does not exist in our system." }));
    const error = await createIntention(input).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PaymobApiError);
    expect((error as PaymobApiError).status).toBe(404);
    expect(String((error as Error).message)).toContain("Integration ID");
    expect(String((error as Error).message)).not.toContain("egy_sk_test_secret");
  });

  it("turns a network failure into a PaymobApiError", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(createIntention(input)).rejects.toBeInstanceOf(PaymobApiError);
  });

  it("does not call Paymob when unconfigured", async () => {
    vi.stubEnv("PAYMOB_SECRET_KEY", "");
    await expect(createIntention(input)).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("checkoutUrl", () => {
  it("is Unified Checkout with the public key, never the secret key", () => {
    const url = checkoutUrl("egy_csk_test_xyz");
    expect(url).toBe(
      "https://accept.paymob.com/unifiedcheckout/?publicKey=egy_pk_test_public&clientSecret=egy_csk_test_xyz"
    );
    expect(url).not.toContain("egy_sk_test_secret");
  });
});

describe("findTransactionByReference", () => {
  it("exchanges the API key for a token and asks by our reference", async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, { token: "auth-token" }))
      .mockResolvedValueOnce(json(200, { id: 99, success: true, pending: false, order: { id: 1 } }));

    await expect(findTransactionByReference("payment-1")).resolves.toMatchObject({ id: 99 });

    expect(call(0).url).toBe("https://accept.paymob.com/api/auth/tokens");
    expect(call(0).body).toEqual({ api_key: "api-key" });
    expect(call(1).url).toBe("https://accept.paymob.com/api/ecommerce/orders/transaction_inquiry");
    expect((call(1).init.headers as Record<string, string>).Authorization).toBe("Bearer auth-token");
    expect(call(1).body).toEqual({ merchant_order_id: "payment-1" });
  });

  it("is null when nobody has paid yet", async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, { token: "auth-token" }))
      .mockResolvedValueOnce(json(404, { detail: "Transaction Not Found" }));
    await expect(findTransactionByReference("payment-1")).resolves.toBeNull();
  });

  it("throws on any other failure, so the caller does not read it as unpaid", async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, { token: "auth-token" }))
      .mockResolvedValueOnce(json(500, "<html>Bad gateway</html>"));
    await expect(findTransactionByReference("payment-1")).rejects.toBeInstanceOf(PaymobApiError);
  });
});

describe("refundTransaction", () => {
  it("refunds by transaction id with the secret key", async () => {
    fetchMock.mockResolvedValue(json(200, { id: 100, success: true }));
    await refundTransaction("99", 150_000);
    expect(call().url).toBe("https://accept.paymob.com/api/acceptance/void_refund/refund");
    expect(call().body).toEqual({ transaction_id: 99, amount_cents: 150_000 });
  });

  it("refuses a zero, negative or fractional amount before calling Paymob", async () => {
    for (const amount of [0, -100, 10.5]) {
      await expect(refundTransaction(99, amount)).rejects.toBeInstanceOf(RangeError);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
