/**
 * The transaction object Paymob sends as `obj` on the transaction callback,
 * and returns from the inquiry API. Only the fields AutoMe reads, plus the
 * ones the HMAC covers; Paymob sends many more.
 */
export interface PaymobTransaction {
  id: number;
  amount_cents: number;
  created_at: string;
  currency: string;
  success: boolean;
  pending: boolean;
  error_occured: boolean;
  has_parent_transaction: boolean;
  integration_id: number;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  owner: number;
  order: {
    id: number;
    /** Our Payment id, sent as the intention's `special_reference`. */
    merchant_order_id?: string | null;
  };
  source_data?: {
    /** Last four card digits, or the wallet's phone number. */
    pan?: string | null;
    /** "MasterCard", "Visa", "wallet"… */
    sub_type?: string | null;
    /** "card", "wallet"… */
    type?: string | null;
  } | null;
  data?: { message?: string | null } | null;
}

export type TransactionOutcome = "paid" | "failed" | "pending";

/**
 * What a transaction means for the payment it belongs to. Paid only when it
 * succeeded and is final; a voided or refunded transaction did not pay.
 */
export function transactionOutcome(tx: PaymobTransaction): TransactionOutcome {
  if (tx.pending) return "pending";
  if (tx.success && !tx.is_voided && !tx.is_refunded) return "paid";
  return "failed";
}
