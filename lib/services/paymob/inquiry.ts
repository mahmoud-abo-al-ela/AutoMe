import { paymobConfig } from "./config";
import { PaymobApiError, paymobRequest } from "./http";
import type { PaymobTransaction } from "./transaction";

/**
 * Asking Paymob for a payment's result, for when the callback has not arrived:
 * the success page (the buyer is often back before the callback) and the daily
 * job (a callback lost to a deploy or an outage).
 *
 * The answer comes over Paymob's authenticated API, so it is as trustworthy
 * as a verified callback and settles a payment the same way.
 *
 * This API predates intentions and authenticates with a short-lived token
 * exchanged for the API key, not with the secret key.
 */

async function authToken(): Promise<string> {
  const { apiKey } = paymobConfig();
  const { token } = await paymobRequest<{ token: string }>("/api/auth/tokens", {
    body: { api_key: apiKey },
  });
  return token;
}

/**
 * The transaction for one of our Payment ids (the intention's
 * `special_reference`), or null when nobody has paid or tried to pay it yet.
 */
export async function findTransactionByReference(reference: string): Promise<PaymobTransaction | null> {
  const token = await authToken();
  try {
    return await paymobRequest<PaymobTransaction>("/api/ecommerce/orders/transaction_inquiry", {
      authorization: `Bearer ${token}`,
      body: { merchant_order_id: reference },
    });
  } catch (error) {
    // Checked against the sandbox: an intention nobody has paid answers
    // 404 {"detail":"Transaction Not Found"}.
    if (error instanceof PaymobApiError && error.status === 404) return null;
    throw error;
  }
}
