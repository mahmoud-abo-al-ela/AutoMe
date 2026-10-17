import { paymobConfig } from "./config";
import { PaymobApiError, paymobRequest } from "./http";
import type { PaymobTransaction } from "./transaction";

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
