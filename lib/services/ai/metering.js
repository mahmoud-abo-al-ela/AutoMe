// AI metering service - records one row per AI provider call. Never throws.
import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import { logError } from "@/lib/utils/errors";

/**
 * Record a single AI provider call.
 *
 * Awaits the insert inside try/catch so a metering failure never breaks the
 * caller's response — but does NOT fire-and-forget: a detached promise can be
 * killed when the serverless function returns. Failures are recorded too
 * (`success: false`, `errorCode`); without a test framework that error rate is
 * the only telemetry here, and on the free tier it's how the quota breaker knows
 * how close we are to the cap.
 *
 * `data.organizationId` is nullable (public marketplace search has no tenant) and
 * must be server-sourced by the caller, never from client input.
 *
 * @param {object} data - AiUsage row fields (feature, model, tokens, success, ...)
 */
export async function recordAiUsage(data) {
    try {
        await aiUsageRepository.createAiUsage(data);
    } catch (error) {
        logError("Failed to record AI usage", error, { feature: data?.feature });
    }
}
