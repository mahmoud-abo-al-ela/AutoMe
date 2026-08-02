// AI usage repository - Data access layer for AI usage mutations
import { db } from "@/lib/prisma";

/**
 * Record a single AI provider call. Written by lib/services/ai/metering.js
 * (recordAiUsage), which always awaits this inside try/catch — never
 * fire-and-forget, since a detached promise can be killed when the serverless
 * function returns.
 *
 * `data.organizationId` is nullable (public marketplace search has no tenant) and
 * is server-sourced, never from client input. Failures are recorded too
 * (`success: false`, `errorCode`) — that error rate is the repo's only telemetry.
 */
export async function createAiUsage(data) {
    return db.aiUsage.create({ data });
}
