import * as paymentRepo from "@/lib/repositories/payment";
import type { PaymentSummary } from "@/lib/repositories/payment";
import { findTransactionByReference } from "@/lib/services/paymob";
import { NotFoundError, logError } from "@/lib/utils/errors";
import { settlePayment } from "./settle";

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

/**
 * A sign-up payment, for the person who started it. Anyone else's payment —
 * or a payment that is not a sign-up — reads as no payment at all.
 */
export async function confirmSignupPaymentFor(userId: string, paymentId: string) {
  const payment = await paymentRepo.findPaymentSummary(paymentId);
  if (!payment || payment.userId !== userId || payment.purpose !== "SIGNUP") {
    throw new NotFoundError("Payment");
  }
  return confirmPayment(payment);
}

/**
 * A renewal or upgrade, for the dealership it pays for. Another dealership's
 * payment — or a sign-up — reads as no payment at all.
 */
export async function confirmDealershipPayment(organizationId: string, paymentId: string) {
  const payment = await paymentRepo.findPaymentSummary(paymentId);
  if (!payment || payment.organizationId !== organizationId || payment.purpose === "SIGNUP") {
    throw new NotFoundError("Payment");
  }
  return confirmPayment(payment);
}
