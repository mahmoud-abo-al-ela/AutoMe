import type { AiFeature } from "@/lib/ai/features";
import type { ProviderId } from "@/lib/ai/providers";
import { logError } from "@/lib/utils/errors";

/** Where a reply came from — what feedback and evaluation are traced back to. */
export interface AiCallMeta {
  /** The AiUsage row of the attempt that answered; null on a cache hit or a lost row. */
  usageId: string | null;
  provider: ProviderId;
  model: string;
  promptVersion: string;
  cached: boolean;
}

/** One answered call, as a listener sees it. */
export type AiCallRecord = AiCallMeta & { feature: AiFeature };

const callListeners = new Set<(call: AiCallRecord) => void>();

export function subscribeAiCalls(listener: (call: AiCallRecord) => void): () => void {
  callListeners.add(listener);
  return () => callListeners.delete(listener);
}

export function announce(feature: AiFeature, meta: AiCallMeta) {
  for (const listener of callListeners) {
    try {
      listener({ feature, ...meta });
    } catch (error) {
      logError("AI call listener threw; ignoring", error);
    }
  }
}
