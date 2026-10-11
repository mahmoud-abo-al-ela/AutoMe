import type { AiCallerContext } from "@/lib/ai/client";
import type { AiFeature } from "@/lib/ai/features";
import { estimateCostMicroUsd, type TokenUsage } from "@/lib/ai/models";
import type { ProviderId } from "@/lib/ai/providers";
import { recordTokens } from "@/lib/ai/breaker";
import { createAiUsage } from "@/lib/repositories/ai-usage";
import { logError } from "@/lib/utils/errors";

/**
 * The AI ledger's writer, shared by every kind of provider call — text
 * generation (client.ts) and embeddings (embeddings.ts) alike. One row per
 * request the provider received, success or failure: see the ai-metering
 * skill for why each rule here exists.
 */

export const ZERO_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  thinkingTokens: 0,
  cachedTokens: 0,
};

export interface MeterInput {
  ctx: AiCallerContext | null | undefined;
  feature: AiFeature;
  provider: ProviderId;
  /** Which key (and pool): what AiUsage.provider records and the caps count. */
  ledger: string;
  model: string;
  usage: TokenUsage;
  latencyMs: number;
  success: boolean;
  errorCode: string | null;
}

/**
 * Write one ledger row. Never throws: losing a usage row is bad, but failing a
 * dealer's upload because the ledger write failed is worse. Awaited rather than
 * detached, because a floating promise dies when the function returns.
 *
 * Returns the row's id, or null when it could not be written.
 */
export async function meter(input: MeterInput): Promise<string | null> {
  try {
    const row = await createAiUsage({
      organizationId: input.ctx?.organizationId ?? null,
      userId: input.ctx?.userId ?? null,
      feature: input.feature,
      provider: input.ledger,
      model: input.model,
      inputTokens: input.usage.inputTokens,
      outputTokens: input.usage.outputTokens,
      thinkingTokens: input.usage.thinkingTokens,
      cachedTokens: input.usage.cachedTokens,
      costMicroUsd: estimateCostMicroUsd(input.model, input.usage, input.provider),
      latencyMs: input.latencyMs,
      success: input.success,
      errorCode: input.errorCode,
    });
    const { inputTokens, outputTokens, thinkingTokens } = input.usage;
    await recordTokens(input.ledger, inputTokens + outputTokens + thinkingTokens);
    return row?.id ?? null;
  } catch (error) {
    logError("AiUsage write failed", error);
    return null;
  }
}
