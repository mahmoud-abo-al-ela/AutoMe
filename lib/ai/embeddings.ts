import type { AiCallerContext } from "@/lib/ai/client";
import type { AiFeature } from "@/lib/ai/features";
import { capacityBlock, poolLedger, reserveRequest } from "@/lib/ai/breaker";
import * as cache from "@/lib/ai/cache";
import { meter, ZERO_USAGE } from "@/lib/ai/meter";
import { PROVIDERS, keysFor } from "@/lib/ai/providers";
import type { EmbeddingTask } from "@/lib/ai/provider/types";
import {
  errorCodeOf,
  isCapacityError,
  isProviderUnavailableError,
  isRateLimitError,
} from "@/lib/ai/provider/errors";
import { aiSpan } from "@/lib/ai/tracing";
import { ServiceUnavailableError } from "@/lib/utils/errors";

/**
 * Text to vectors, for meaning-based retrieval (pgvector).
 *
 * **One model, no fallback chain** — unlike text generation. A vector is only
 * comparable with vectors from the same model, so a "fallback" model would
 * write vectors nothing can be searched against. Every stored vector records
 * its model (`embeddingModel`), every search filters on it, and when the model
 * is unavailable the caller degrades (no semantic ranking) or retries (a job).
 * Changing AI_EMBEDDING_MODEL means re-embedding: the backfill cron does it.
 *
 * Shares the client's guard rails: the breaker (in its own "embed" pool, so
 * embedding never spends the text models' allowance), a ledger row per
 * request, the response cache, a span, and the shared error classification.
 * Google returns no token counts for embeddings, so the rows say 0 — honest,
 * where a guess would read as real.
 */

/** The column is vector(768); every vector stored or searched must be this long. */
export const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_MODEL = "gemini-embedding-2";
/** Embedding is fast; one that has not answered in this long is not going to. */
const TIMEOUT_MS = 8_000;
/** The most texts one request carries. */
const BATCH = 100;

export function embeddingModel(): string {
  return process.env.AI_EMBEDDING_MODEL?.trim() || DEFAULT_MODEL;
}

export interface EmbedInput {
  feature: AiFeature;
  texts: string[];
  task: EmbeddingTask;
  ctx?: AiCallerContext | null;
  /** Per-request ceiling; shorter where a person is waiting. */
  timeoutMs?: number;
  /**
   * Runs once before any provider request, only when some text missed the
   * cache — a rate limit that cached repeats never spend. Throw to refuse.
   */
  beforeRequest?: () => Promise<void>;
}

export interface Embeddings {
  /** The model that made them — stored beside each vector. */
  model: string;
  vectors: number[][];
}

const keyOf = (feature: string, model: string, task: EmbeddingTask, text: string) =>
  cache.cacheKey({ feature, model: `google/${model}`, promptVersion: `${EMBEDDING_DIMENSIONS}.${task}`, bytes: text });

/**
 * Embed texts, in order. Throws ServiceUnavailableError when no key could
 * serve them — the caller decides whether that degrades or retries.
 */
export async function embedTexts(input: EmbedInput): Promise<Embeddings> {
  const model = embeddingModel();
  const vectors: (number[] | undefined)[] = new Array(input.texts.length);

  // A repeated question needs no request.
  await Promise.all(
    input.texts.map(async (text, i) => {
      vectors[i] = await cache.get<number[]>(keyOf(input.feature, model, input.task, text));
    })
  );
  const missing = input.texts.map((_, i) => i).filter((i) => vectors[i] === undefined);
  if (missing.length > 0 && input.beforeRequest) await input.beforeRequest();

  for (let start = 0; start < missing.length; start += BATCH) {
    const batch = missing.slice(start, start + BATCH);
    const made = await embedBatch(input, model, batch.map((i) => input.texts[i]));
    for (const [n, i] of batch.entries()) {
      vectors[i] = made[n];
      await cache.set(keyOf(input.feature, model, input.task, input.texts[i]), made[n]);
    }
  }
  return { model, vectors: vectors as number[][] };
}

async function embedBatch(input: EmbedInput, model: string, texts: string[]): Promise<number[][]> {
  const keys = keysFor("google");
  const provider = PROVIDERS.google.provider;
  if (keys.length === 0 || !provider.embed) {
    throw new ServiceUnavailableError("No embedding provider is configured", { key: "errors.ai.unavailable" });
  }
  const priority = input.ctx?.priority;
  let lastError: unknown = null;

  for (const [keyIndex, apiKey] of keys.entries()) {
    if (await capacityBlock("google", keyIndex, priority, "embed")) continue;
    if (!(await reserveRequest("google", keyIndex, priority, "embed"))) continue;

    const ledger = poolLedger("google", keyIndex, "embed");
    const started = Date.now();
    let errorCode: string | null = null;
    try {
      const { vectors } = await aiSpan(
        "gen_ai.embeddings",
        `embeddings google/${model}`,
        {
          "gen_ai.system": "google",
          "gen_ai.operation.name": "embeddings",
          "gen_ai.request.model": model,
          "autome.ai.feature": input.feature,
          "autome.ai.texts": texts.length,
        },
        () => provider.embed!({ model, texts, dimensions: EMBEDDING_DIMENSIONS, task: input.task, signal: AbortSignal.timeout(input.timeoutMs ?? TIMEOUT_MS) }, apiKey)
      );
      return vectors;
    } catch (error) {
      lastError = error;
      errorCode = errorCodeOf(error);
    } finally {
      await meter({
        ctx: input.ctx,
        feature: input.feature,
        provider: "google",
        ledger,
        model,
        usage: ZERO_USAGE,
        latencyMs: Date.now() - started,
        success: errorCode === null,
        errorCode,
      });
    }
    // A key-shaped refusal may not hold for the next key; anything else would.
    const anotherKeyMightWork =
      isRateLimitError(lastError) || isCapacityError(lastError) || isProviderUnavailableError(lastError);
    if (!anotherKeyMightWork) break;
  }

  throw new ServiceUnavailableError(lastError ? "Embedding failed" : "Embedding capacity reached", {
    key: lastError ? "errors.ai.unavailable" : "errors.ai.busy",
  });
}

/** A vector as pgvector's text form, for a parameter cast with ::vector. */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
