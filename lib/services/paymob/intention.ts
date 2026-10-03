import { PAYMOB_BASE_URL, paymobConfig } from "./config";
import { paymobRequest } from "./http";

/**
 * Paymob's Intention API: one intention per payment attempt, paid on Paymob's
 * hosted Unified Checkout page. Its client secret is single-use, so a retry
 * needs a new intention.
 */

export interface IntentionBilling {
  firstName: string;
  lastName: string;
  email: string;
  /** Required by Paymob (400 without it). International form: "+201001234567". */
  phoneNumber: string;
}

export interface IntentionInput {
  /** Piasters. Must equal the sum of the items. */
  amountCents: number;
  currency: "EGP";
  /** Integration IDs offered on the checkout page. */
  paymentMethods: number[];
  items: { name: string; amountCents: number; description?: string }[];
  billing: IntentionBilling;
  /** Our Payment id; the callback returns it as `order.merchant_order_id`. */
  specialReference: string;
  /** Public HTTPS: Paymob cannot reach localhost. */
  notificationUrl: string;
  /** Where the buyer lands afterwards. Its query string is unsigned. */
  redirectionUrl: string;
  /** Seconds until the intention can no longer be paid. */
  expiresInSeconds?: number;
}

export interface Intention {
  /** "pi_test_…" / "pi_live_…". */
  intentionId: string;
  /** Paymob's order, the `order.id` on the transaction callback. */
  orderId: string;
  clientSecret: string;
  /** The integrations Paymob will actually offer: it drops one it has not enabled for checkout. */
  offeredIntegrationIds: number[];
}

interface IntentionResponse {
  id: string;
  intention_order_id: number;
  client_secret: string;
  payment_methods?: { integration_id: number }[];
}

// Paymob's billing data asks for a street address it does not check for card
// payments; "NA" is what its own samples send.
const NOT_APPLICABLE = "NA";

export async function createIntention(input: IntentionInput): Promise<Intention> {
  const { secretKey } = paymobConfig();

  const data = await paymobRequest<IntentionResponse>("/v1/intention/", {
    authorization: `Token ${secretKey}`,
    body: {
      amount: input.amountCents,
      currency: input.currency,
      payment_methods: input.paymentMethods,
      items: input.items.map((item) => ({
        name: item.name,
        amount: item.amountCents,
        description: item.description ?? item.name,
        quantity: 1,
      })),
      billing_data: {
        first_name: input.billing.firstName,
        last_name: input.billing.lastName,
        email: input.billing.email,
        phone_number: input.billing.phoneNumber,
        apartment: NOT_APPLICABLE,
        floor: NOT_APPLICABLE,
        street: NOT_APPLICABLE,
        building: NOT_APPLICABLE,
        city: NOT_APPLICABLE,
        state: NOT_APPLICABLE,
        country: "EGY",
      },
      special_reference: input.specialReference,
      notification_url: input.notificationUrl,
      redirection_url: input.redirectionUrl,
      ...(input.expiresInSeconds ? { expiration: input.expiresInSeconds } : {}),
    },
  });

  return {
    intentionId: data.id,
    orderId: String(data.intention_order_id),
    clientSecret: data.client_secret,
    offeredIntegrationIds: (data.payment_methods ?? []).map((method) => method.integration_id),
  };
}

/** Paymob's hosted checkout page for an intention. */
export function checkoutUrl(clientSecret: string): string {
  const { publicKey } = paymobConfig();
  const params = new URLSearchParams({ publicKey, clientSecret });
  return `${PAYMOB_BASE_URL}/unifiedcheckout/?${params}`;
}
