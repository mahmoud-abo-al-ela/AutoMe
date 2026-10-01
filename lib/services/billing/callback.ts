import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/repositories/webhook";
import {
  paymobConfig,
  transactionOutcome,
  verifyTransactionHmac,
  type PaymobTransaction,
} from "@/lib/services/paymob";
import { logError } from "@/lib/utils/errors";
import { settlePayment } from "./settle";

/**
 * Paymob's transaction callback, framework-free so it can be tested without
 * Next: the route hands over the parsed body and the `hmac` query parameter.
 *
 *   - Unconfigured → 500, nothing read (fails closed).
 *   - Bad or missing signature → 401, nothing written.
 *   - A pending transaction → 200, nothing written: the final state follows
 *     as its own callback.
 *   - Each (transaction, outcome) is claimed once in WebhookEvent; a repeat
 *     delivery → 200 without re-running. A transaction's outcome is part of
 *     the key because Paymob can report one transaction twice (pending, then
 *     final).
 *   - Settlement fails → the claim is released and 500 returned, so Paymob's
 *     retry runs it again.
 */

export interface CallbackResponse {
  status: number;
  body: Record<string, unknown>;
}

const reply = (status: number, body: Record<string, unknown>): CallbackResponse => ({ status, body });

export async function handlePaymobCallback(
  payload: unknown,
  hmac: string | null
): Promise<CallbackResponse> {
  let hmacSecret: string;
  try {
    ({ hmacSecret } = paymobConfig());
  } catch (error) {
    logError("Paymob callback rejected: Paymob is not configured.", error);
    return reply(500, { error: "Not configured" });
  }

  const { type, obj } = (payload ?? {}) as { type?: unknown; obj?: unknown };
  if (!obj || typeof obj !== "object") return reply(400, { error: "No transaction" });

  // Card-token callbacks are signed over other fields; AutoMe saves no cards.
  if (type !== "TRANSACTION") return reply(200, { received: true, ignored: "type" });

  if (!verifyTransactionHmac(obj, hmac, hmacSecret)) {
    return reply(401, { error: "Invalid signature" });
  }

  const transaction = obj as PaymobTransaction;
  const reference = transaction.order?.merchant_order_id;
  // A payment not started by AutoMe (a dashboard payment link) carries no reference.
  if (!reference) return reply(200, { received: true, ignored: "reference" });

  const outcome = transactionOutcome(transaction);
  if (outcome === "pending") return reply(200, { received: true, pending: true });

  const eventId = `${transaction.id}:${outcome}`;
  const claimed = await claimWebhookEvent({ id: eventId, provider: "paymob", type: `transaction.${outcome}` });
  if (!claimed) return reply(200, { received: true, duplicate: true });

  try {
    const result = await settlePayment(String(reference), transaction);
    return reply(200, { received: true, result: result.status });
  } catch (error) {
    await releaseWebhookEvent(eventId).catch((releaseError) =>
      logError("Failed to release Paymob callback claim:", releaseError)
    );
    logError(`Paymob callback for transaction ${transaction.id} failed:`, error);
    return reply(500, { error: "Callback failed" });
  }
}
