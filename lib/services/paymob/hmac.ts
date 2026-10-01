import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymobTransaction } from "./transaction";

/**
 * Verification of Paymob's transaction callback.
 *
 * Anyone can POST to the callback URL, so the callback is trusted only when
 * the `hmac` query parameter is HMAC-SHA512, keyed with the account's HMAC
 * secret, over these twenty fields of `obj` concatenated with no separator,
 * in Paymob's fixed order (not alphabetical). Booleans are "true"/"false",
 * numbers their plain form, strings exactly as received.
 *
 * The buyer's redirect back to AutoMe carries the same fields in its query
 * string; it is never used to change state.
 */
const FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function field(obj: unknown, path: string): string {
  let value: unknown = obj;
  for (const key of path.split(".")) {
    value = value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
  }
  // An absent field contributes nothing. (Paymob's samples never omit one of
  // these for cards; to be confirmed for wallets on the first live callback.)
  return value === null || value === undefined ? "" : String(value);
}

/** The string Paymob signs. Exported for the test against Paymob's worked example. */
export function transactionHmacMessage(obj: PaymobTransaction | Record<string, unknown>): string {
  return FIELDS.map((path) => field(obj, path)).join("");
}

export function transactionHmac(obj: PaymobTransaction | Record<string, unknown>, secret: string): string {
  return createHmac("sha512", secret).update(transactionHmacMessage(obj)).digest("hex");
}

/** Whether `received` is Paymob's signature of `obj`. Constant-time. */
export function verifyTransactionHmac(
  obj: unknown,
  received: string | null | undefined,
  secret: string
): boolean {
  if (!secret || !received || !obj || typeof obj !== "object") return false;
  const expected = Buffer.from(transactionHmac(obj as Record<string, unknown>, secret), "utf8");
  const actual = Buffer.from(received.trim().toLowerCase(), "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
