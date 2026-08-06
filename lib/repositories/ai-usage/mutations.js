// AI usage repository - Data access layer for AI usage mutations
import { db } from "@/lib/prisma";

/**
 * Record a single AI provider call. Callers should await this inside try/catch —
 * never fire-and-forget, since a detached promise can be killed when the
 * serverless function returns.
 *
 * `data.organizationId` is nullable and is server-sourced, never from client
 * input. Failures should be recorded too (`success: false`, `errorCode`) — that
 * error rate is the repo's only telemetry.
 */
export async function createAiUsage(data) {
    return db.aiUsage.create({ data });
}
