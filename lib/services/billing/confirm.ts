import * as paymentRepo from "@/lib/repositories/payment";
import type { PaymentSummary } from "@/lib/repositories/payment";
import { findTransactionByReference } from "@/lib/services/paymob";
import { logError } from "@/lib/utils/errors";
import { settlePayment } from "./settle";

/**
 * Where a payment stands, for the page Paymob returns the buyer to.
 *
 * The buyer is often back before Paymob's callback arrives (and on localhost
 * it never arrives), so an unpaid payment is looked up with Paymob directly
 * and settled from the answer, exactly as the callback would. The query string
 * Paymob adds to the return URL is never read: it is unsigned.
 *
 * Callers check the payment is the viewer's own before calling.
 */

export type PaymentState =
  | { state: "paid"; payment: PaymentSummary }
  /** Not paid yet, or Paymob has not said: the page waits and asks again. */
  | { state: "pending"; payment: PaymentSummary }
  /** Declined or abandoned: the buyer can try again. */
  | { state: "failed"; payment: PaymentSummary };

export async function confirmPayment(payment: PaymentSummary): Promise<PaymentState> {
  if (payment.status === "PAID") return { state: "paid", payment };
  if (payment.status === "REFUNDED") return { state: "failed", payment };

  try {
    const transaction = await findTransactionByReference(payment.id);
    if (transaction) await settlePayment(payment.id, transaction);
  } catch (error) {
    // Paymob unreachable or the settlement failed: the callback or the next
    // refresh will try again; the page keeps waiting rather than erroring.
    logError(`Could not confirm payment ${payment.id} with Paymob:`, error);
  }

  const current = (await paymentRepo.findPaymentSummary(payment.id)) ?? payment;
  if (current.status === "PAID") return { state: "paid", payment: current };
  if (current.status === "FAILED" || current.status === "EXPIRED" || current.status === "REFUNDED") {
    return { state: "failed", payment: current };
  }
  return { state: "pending", payment: current };
}
