import { ServiceUnavailableError } from "@/lib/utils/errors";

/**
 * Paymob credentials, read from the environment when a payment needs them.
 *
 * Fails closed: a missing variable throws rather than letting a checkout start
 * without a callback secret, or a callback be "verified" against an empty
 * HMAC key. The throw names the variables for the log, and the user sees the
 * translated "billing isn't available" message.
 *
 * Test and live keys must be used with integration IDs of the same mode;
 * mixing them makes Paymob answer 404 "Integration ID/Name does not exist".
 */

/** Egypt's Paymob host. Test and live share it; the keys pick the mode. */
export const PAYMOB_BASE_URL = "https://accept.paymob.com";

export interface PaymobConfig {
  /** Older auth-token API (transaction inquiry). */
  apiKey: string;
  /** Intention API and refunds: `Authorization: Token <secretKey>`. */
  secretKey: string;
  /** Sent to the browser in the checkout URL. */
  publicKey: string;
  /** Key for the transaction callback's HMAC-SHA512. */
  hmacSecret: string;
  cardIntegrationId: number;
  /** Not offered yet: wallets join once Paymob moves the integration off Shopify. */
  walletIntegrationId: number | null;
}

const REQUIRED = [
  "PAYMOB_API_KEY",
  "PAYMOB_SECRET_KEY",
  "PAYMOB_PUBLIC_KEY",
  "PAYMOB_HMAC_SECRET",
  "PAYMOB_CARD_INTEGRATION_ID",
] as const;

function integrationId(name: string): number | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ServiceUnavailableError(`Paymob is misconfigured: ${name} is not an integration ID`, {
      key: "errors.billing.notConfigured",
    });
  }
  return id;
}

export function paymobConfig(): PaymobConfig {
  const missing = REQUIRED.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new ServiceUnavailableError(`Paymob is not configured: missing ${missing.join(", ")}`, {
      key: "errors.billing.notConfigured",
    });
  }

  const read = (name: (typeof REQUIRED)[number]) => process.env[name]!.trim();
  return {
    apiKey: read("PAYMOB_API_KEY"),
    secretKey: read("PAYMOB_SECRET_KEY"),
    publicKey: read("PAYMOB_PUBLIC_KEY"),
    hmacSecret: read("PAYMOB_HMAC_SECRET"),
    cardIntegrationId: integrationId("PAYMOB_CARD_INTEGRATION_ID")!,
    walletIntegrationId: integrationId("PAYMOB_WALLET_INTEGRATION_ID"),
  };
}
