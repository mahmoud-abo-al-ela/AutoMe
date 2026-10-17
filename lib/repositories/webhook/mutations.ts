// Webhook repository - idempotency ledger for provider webhooks (Paymob, Clerk)
import { db } from "@/lib/prisma";

export async function claimWebhookEvent({ id, provider, type }: { id: string; provider: string; type: string }) {
    const { count } = await db.webhookEvent.createMany({
        data: [{ id, provider, type }],
        skipDuplicates: true,
    });
    return count === 1;
}

export async function releaseWebhookEvent(id: string) {
    await db.webhookEvent.deleteMany({ where: { id } });
}
