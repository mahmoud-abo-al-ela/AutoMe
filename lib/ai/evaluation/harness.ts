import { ServiceUnavailableError } from "@/lib/utils/errors";
import type { AiCallerContext } from "@/lib/ai/client";

/**
 * Shared plumbing for the evaluation suites. The suites themselves stay about
 * behaviour; this is how they reach the model.
 */

/** No tenant: evaluation calls are never billed to anyone. */
export const EVAL_CALLER: AiCallerContext = { organizationId: null, userId: null };

/**
 * The limits production uses on the streaming route, so the suite judges the
 * path dealers actually get — including the Gemma fallback when every Flash
 * model is busy or queued.
 */
export const PRODUCTION_LIMITS = {
  timeoutMs: 170_000,
  budgetMs: 170_000,
  firstTokenTimeoutMs: 45_000,
};

/** Per-case ceiling for vitest, above the AI budget so the budget decides. */
export const CALL_TIMEOUT = 200_000;

/** The File shape `prepareImage` reads, without needing a DOM File. */
export function asFile({ bytes, mimeType }: { bytes: Buffer; mimeType: string }): File {
  return {
    type: mimeType,
    size: bytes.byteLength,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

/**
 * Every model in the chain was busy or unreachable — inconclusive, not wrong.
 * Reporting it as a quality regression is how a suite stops being believed.
 */
export function isCapacityFailure(error: unknown): boolean {
  return error instanceof ServiceUnavailableError;
}
