import { AI_FEATURES, type AiFeature } from "@/lib/ai/features";
import type { AiPart } from "@/lib/ai/provider/types";
import { redactParts, redactText } from "@/lib/ai/redact";
import { createAiTrace, pruneAiTraces } from "@/lib/repositories/ai-trace";
import { logError } from "@/lib/utils/errors";

const ALWAYS: ReadonlySet<AiFeature> = new Set([AI_FEATURES.listingQA]);
const DEFAULT_SAMPLE_RATE = 0.1;
/** Prune on roughly one write in this many: retention without a cron. */
const PRUNE_ONE_IN = 200;

function sampleRate(): number {
  const parsed = Number.parseFloat(process.env.AI_TRACE_SAMPLE_RATE ?? "");
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : DEFAULT_SAMPLE_RATE;
}

export function shouldTrace(feature: AiFeature, privateContent: boolean, random: () => number = Math.random): boolean {
  if (privateContent) return false;
  return ALWAYS.has(feature) || random() < sampleRate();
}

export interface TraceInput {
  aiUsageId: string | null;
  feature: AiFeature;
  model: string;
  promptVersion: string;
  parts: AiPart[];
  output: string | undefined;
  errorCode: string | null;
}

/**
 * Keep one attempt's trace. Never throws, and awaited like the ledger row: a
 * lost trace is a debugging inconvenience, a failed answer is not.
 */
export async function recordTrace(trace: TraceInput): Promise<void> {
  try {
    await createAiTrace({
      aiUsageId: trace.aiUsageId,
      feature: trace.feature,
      model: trace.model,
      promptVersion: trace.promptVersion,
      input: redactParts(trace.parts),
      output: trace.output === undefined ? null : redactText(trace.output),
      errorCode: trace.errorCode,
    });
    if (Math.random() * PRUNE_ONE_IN < 1) await pruneAiTraces();
  } catch (error) {
    logError("AiTrace write failed", error);
  }
}
