import { paymobConfig } from "./config";
import { paymobRequest } from "./http";
import type { PaymobTransaction } from "./transaction";

export async function refundTransaction(
  transactionId: string | number,
  amountCents: number
): Promise<PaymobTransaction> {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new RangeError(`Refund amount must be a positive number of piasters, got ${amountCents}`);
  }
  const { secretKey } = paymobConfig();
  return paymobRequest<PaymobTransaction>("/api/acceptance/void_refund/refund", {
    authorization: `Token ${secretKey}`,
    body: { transaction_id: Number(transactionId), amount_cents: amountCents },
  });
}
