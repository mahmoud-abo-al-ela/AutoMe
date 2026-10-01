// Webhook repository - idempotency ledger for provider webhooks (Paymob, Clerk)
import { db } from "@/lib/prisma";

/**
 * Atomically claim a webhook event for processing (idempotency guard).
 *
 * Inserts a WebhookEvent row keyed by the provider's own event id. Because the id
 * is the primary key, a duplicate delivery collides and is skipped. Returns `true`
 * only for the caller that won the insert — every retry/duplicate gets `false`.
 * This is race-safe under concurrent deliveries (unlike a check-then-act read).
 */
export async function claimWebhookEvent({ id, provider, type }: { id: string; provider: string; type: string }) {
    const { count } = await db.webhookEvent.createMany({
        data: [{ id, provider, type }],
        skipDuplicates: true,
    });
    return count === 1;
}

/**
 * Release a previously-claimed webhook event so the provider's retry can
 * re-process it. Call this when handling failed *after* the claim — otherwise
 * the failed event would be permanently skipped as a "duplicate".
 */
export async function releaseWebhookEvent(id: string) {
    await db.webhookEvent.deleteMany({ where: { id } });
}
