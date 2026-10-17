import type { ZodType } from "zod";
import type { AiPart } from "@/lib/ai/provider/types";
import {
  errorCodeOf,
  isAbortError,
  isCapacityError,
  isModelUnavailableError,
  isProviderUnavailableError,
  isRateLimitError,
} from "@/lib/ai/provider/errors";
import { PROVIDERS, keysFor, ledgerId, type ProviderId } from "@/lib/ai/providers";
import type { AiFeature } from "@/lib/ai/features";
import {
  entryLabel,
  modelsFor,
  type ChainEntry,
  type ModelTask,
} from "@/lib/ai/models";
import { capacityBlock, type CapacityPriority } from "@/lib/ai/breaker";
import * as cache from "@/lib/ai/cache";
import { aiSpan } from "@/lib/ai/tracing";
import { shouldTrace } from "@/lib/ai/trace";
import { ServiceUnavailableError, AppError, logError } from "@/lib/utils/errors";
import { toJsonSchema } from "@/lib/utils/json-schema";
import { KeyCappedError, QueueTimeoutError, attemptModel, devLog, followUpFits, isUnreadableReply } from "@/lib/ai/attempt";
import { announce, type AiCallMeta } from "@/lib/ai/call-listeners";

export { subscribeAiCalls, type AiCallMeta, type AiCallRecord } from "@/lib/ai/call-listeners";
export { KeyCappedError, QueueTimeoutError } from "@/lib/ai/attempt";

export interface AiCallerContext {
  organizationId: string | null;
  /** The database User.id — not the Clerk id, which the AiUsage foreign key rejects. */
  userId: string | null;
  /** Share of the platform cap this caller may use. Defaults to "standard". */
  priority?: CapacityPriority;
}

/**
 * What actually happened during a call, for a caller that streams progress to
 * the user. Every event is a real occurrence — nothing here is estimated.
 */
export type AiProgressEvent =
  /** Served from the response cache; no request is sent. */
  | { type: "cached" }
  /** A request is about to go to `model`: the first, a retry, or a fallback. */
  | {
      type: "attempt";
      provider: ProviderId;
      model: string;
      /** 0-based position in the task's model chain. */
      modelIndex: number;
      modelCount: number;
      retry: boolean;
    }
  /** The model's reply so far. Only emitted while streaming. */
  | { type: "text"; text: string };

export interface GenerateStructuredInput<T> {
  feature: AiFeature;
  task: ModelTask;
  system?: string;
  parts: AiPart[];
  /** Validates the reply *and* generates the schema sent to the provider. */
  schema: ZodType<T>;
  /**
   * Bumped whenever the prompt text changes. Part of the cache key, so a prompt
   * edit cannot serve answers produced by the previous instructions.
   */
  promptVersion: string;
  ctx?: AiCallerContext | null;
  /** Bytes to key the cache on. Omit to bypass the cache entirely. */
  cacheBytes?: Buffer | string;
  /**
   * Keep this feature's cached replies in the process, never in the shared
   * cache: for private content such as a chat message.
   */
  privateCache?: boolean;
  timeoutMs?: number;
  /** Wall-clock ceiling for the whole call. Defaults to AI_REQUEST_BUDGET_MS. */
  budgetMs?: number;
  temperature?: number;
  maxAttempts?: number;
  /** See ProviderRequest.thinking. Skipped for models without the control. */
  thinking?: "low";
  /** Reply-length cap; DEFAULT_MAX_OUTPUT_TOKENS unless a feature writes more. */
  maxOutputTokens?: number;
  firstTokenTimeoutMs?: number;
  waitForCapacityMs?: number;
  /**
   * Called with real progress. Setting it also streams the provider reply, so
   * "text" events arrive as the model writes rather than all at once.
   */
  onProgress?: (event: AiProgressEvent) => void;
}

const DEFAULT_TIMEOUT_MS = 20_000;

const DEFAULT_BUDGET_MS = 45_000;

/** How often a call waiting for capacity looks again. */
const CAPACITY_POLL_MS = 5_000;

function waitForCapacityFromEnv(): number {
  const parsed = Number.parseInt(process.env.AI_WAIT_FOR_CAPACITY_MS ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function budgetFromEnv(): number {
  const raw = process.env.AI_REQUEST_BUDGET_MS;
  if (!raw) return DEFAULT_BUDGET_MS;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    logError(`AI_REQUEST_BUDGET_MS is not a positive integer; using ${DEFAULT_BUDGET_MS}`);
    return DEFAULT_BUDGET_MS;
  }
  return parsed;
}

/**
 * Two, not three. Every attempt is a request against a free-tier cap, and
 * `isRetryableError` has already excluded the faults a retry cannot fix.
 */
const DEFAULT_MAX_ATTEMPTS = 2;

const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

/** Derived JSON Schemas are stable per Zod schema, so derive each one once. */
const schemaCache = new WeakMap<object, unknown>();

function jsonSchemaFor(schema: ZodType<unknown>): unknown {
  const cached = schemaCache.get(schema as object);
  if (cached) return cached;

  const json = toJsonSchema(schema);

  schemaCache.set(schema as object, json);
  return json;
}

/** Errors thrown by our own validation already carry a key; pass those through. */
function toPublicError(error: unknown): Error {
  if (error instanceof AppError) return error;

  if (error instanceof KeyCappedError) {
    return new ServiceUnavailableError("AI capacity reached", { key: "errors.ai.busy" });
  }

  if (isAbortError(error) || error instanceof QueueTimeoutError) {
    return new ServiceUnavailableError("The AI request timed out", {
      key: "errors.ai.timeout",
    });
  }

  return new ServiceUnavailableError("The AI provider could not be reached", {
    key: "errors.ai.unavailable",
  });
}

export async function generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
  return (await generateStructuredWithMeta(input)).data;
}

/** generateStructured, plus which model answered and the ledger row it wrote. */
export async function generateStructuredWithMeta<T>(
  input: GenerateStructuredInput<T>
): Promise<{ data: T; meta: AiCallMeta }> {
  return aiSpan(
    "gen_ai.invoke",
    `ai ${input.feature}`,
    {
      "autome.ai.feature": input.feature,
      "autome.ai.task": input.task,
      "autome.ai.prompt_version": input.promptVersion,
    },
    async (span) => {
      const result = await runStructured(input);
      span.set({
        "gen_ai.system": result.meta.provider,
        "gen_ai.response.model": result.meta.model,
        "autome.ai.cached": result.meta.cached,
      });
      return result;
    }
  );
}

async function runStructured<T>(input: GenerateStructuredInput<T>): Promise<{ data: T; meta: AiCallMeta }> {
  // Decided once per call, so every attempt of a traced call is traced.
  const traced = shouldTrace(input.feature, Boolean(input.privateCache));
  const metaFor =(entry: ChainEntry, usageId: string | null, cached: boolean): AiCallMeta => {
    const meta = { usageId, provider: entry.provider, model: entry.model, promptVersion: input.promptVersion, cached };
    announce(input.feature, meta);
    return meta;
  };

  // Only providers with at least one key: an entry can ship before its key does.
  const keyring = new Map<ProviderId, string[]>();
  const keysOf = (provider: ProviderId) => {
    let keys = keyring.get(provider);
    if (!keys) keyring.set(provider, (keys = keysFor(provider)));
    return keys;
  };
  const configured = modelsFor(input.task).filter((entry) => keysOf(entry.provider).length > 0);
  if (configured.length === 0) {
    // A config fault, not a user fault — and it must not look like a rate limit.
    throw new ServiceUnavailableError("No AI provider is configured for this task", {
      key: "errors.ai.unavailable",
    });
  }

  // A progress listener is the caller's UI; a throw from it must never cost
  // the call it is reporting on.
  const emit = (event: AiProgressEvent) => {
    if (!input.onProgress) return;
    try {
      input.onProgress(event);
    } catch (error) {
      logError("AI progress listener threw; ignoring", error);
    }
  };
  const maxAttempts = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const budgetMs = input.budgetMs ?? budgetFromEnv();
  let deadline = Date.now() + budgetMs;

  const keyFor = (entry: ChainEntry) =>
    input.cacheBytes === undefined
      ? null
      : cache.cacheKey({
          feature: input.feature,
          model: entryLabel(entry),
          promptVersion: input.promptVersion,
          bytes: input.cacheBytes,
        });

  // Checked across the whole chain before any call: an answer a fallback model
  // gave earlier is still a valid answer. A hit writes no ledger row, because a
  // row means "a request reached the provider".
  if (input.cacheBytes !== undefined) {
    const hit = await cache.getFirst<T>(configured.map((entry) => keyFor(entry)!), { shared: !input.privateCache });
    if (hit) {
      devLog(`${input.feature} ← cache`);
      emit({ type: "cached" });
      return { data: hit.value, meta: metaFor(configured[hit.index], null, true) };
    }
  }

  // Keys out of play for this request, per provider: at their cap before we
  // start, or refused along the way (rejected, allowance spent). Each key has
  // its own caps; one at its limit is skipped, not fatal.
  const deadKeys = new Map<ProviderId, Set<number>>();
  const providers = [...new Set(configured.map((entry) => entry.provider))];
  let blocks: string[] = [];
  const checkCapacity = async () => {
    blocks = [];
    await Promise.all(
      providers.map(async (provider) => {
        const dead = new Set<number>();
        const checks = await Promise.all(
          keysOf(provider).map((_, index) => capacityBlock(provider, index, input.ctx?.priority))
        );
        checks.forEach((block, index) => {
          if (block) {
            dead.add(index);
            blocks.push(block);
          }
        });
        deadKeys.set(provider, dead);
      })
    );
  };
  const liveKeys = (provider: ProviderId) =>
    keysOf(provider)
      .map((_, index) => index)
      .filter((index) => !deadKeys.get(provider)!.has(index));
  const liveChain = () => configured.filter((entry) => liveKeys(entry.provider).length > 0);

  await checkCapacity();
  let chain = liveChain();
  const waitUntil = Date.now() + (input.waitForCapacityMs ?? waitForCapacityFromEnv());
  if (chain.length === 0 && Date.now() < waitUntil) {
    while (chain.length === 0 && Date.now() < waitUntil) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(CAPACITY_POLL_MS, waitUntil - Date.now())));
      await checkCapacity();
      chain = liveChain();
    }
    // The budget is for the call, not the queue in front of it.
    deadline = Date.now() + budgetMs;
  }
  const models = chain;
  if (models.length === 0) {
    // The message is developer-facing; the client renders `messageKey`.
    throw new ServiceUnavailableError(`AI capacity reached (${blocks.join("; ")})`, {
      key: "errors.ai.busy",
    });
  }

  const responseJsonSchema = jsonSchemaFor(input.schema);
  /** The next entry to try after `after`, skipping providers with no usable key. */
  const nextUsable = (after: number) => {
    for (let i = after + 1; i < models.length; i++) {
      if (liveKeys(models[i].provider).length > 0) return i;
    }
    return -1;
  };
  let lastError: unknown = null;

  for (let index = 0; index >= 0; ) {
    const entry = models[index];
    const isLast = nextUsable(index) < 0;
    const { attemptTimeoutMs, streamsIncrementally } = PROVIDERS[entry.provider];

    let error: unknown = null;
    for (const keyIndex of liveKeys(entry.provider)) {
      const attemptStarted = Date.now();
      try {
        const result = await attemptModel({
          entry,
          apiKey: keysOf(entry.provider)[keyIndex],
          keyIndex,
          ledger: ledgerId(entry.provider, keyIndex),
          feature: input.feature,
          system: input.system,
          parts: input.parts,
          schema: input.schema,
          responseJsonSchema,
          ctx: input.ctx,
          timeoutMs: input.timeoutMs ?? attemptTimeoutMs ?? DEFAULT_TIMEOUT_MS,
          deadline,
          temperature: input.temperature,
          maxAttempts,
          thinking: input.thinking,
          maxOutputTokens: input.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
          // The last model keeps the rest of the budget: there is nowhere left
          // to hand over to, so cutting it short only guarantees a failure. A
          // provider that does not stream has no "first token" to wait for.
          firstTokenMs:
            isLast || !streamsIncrementally ? undefined : input.firstTokenTimeoutMs,
          modelIndex: index,
          modelCount: models.length,
          emit,
          streaming: Boolean(input.onProgress),
          traced,
          promptVersion: input.promptVersion,
        });

        const key = keyFor(entry);
        if (key) await cache.set(key, result.data, { shared: !input.privateCache });
        devLog(
          `${input.feature} ← ${entryLabel(entry)} (${((Date.now() - attemptStarted) / 1000).toFixed(1)} s)`
        );
        return { data: result.data, meta: metaFor(entry, result.usageId, false) };
      } catch (caught) {
        error = caught;
        lastError = caught;
        // A key refused us, or its cap filled while we walked: out of play for
        // the rest of this request, and the next key may have room.
        if (isProviderUnavailableError(caught) || caught instanceof KeyCappedError) {
          deadKeys.get(entry.provider)!.add(keyIndex);
          continue;
        }
        if (isRateLimitError(caught) && followUpFits(deadline)) continue;
        break;
      }
    }

    const anotherModelMightWork =
      isModelUnavailableError(error) ||
      isCapacityError(error) ||
      isProviderUnavailableError(error) ||
      error instanceof KeyCappedError ||
      isUnreadableReply(error) ||
      error instanceof QueueTimeoutError;
    const next = anotherModelMightWork || isAbortError(error) ? nextUsable(index) : -1;
    // Falling back is only worth it if there is time to hear the answer —
    // a useful margin, not a sliver (see MIN_FOLLOW_UP_MS).
    const timeLeft = followUpFits(deadline);

    if (next < 0 || !timeLeft) throw toPublicError(error);

    // Expected operation, not a fault: one line, no stack. Every attempt is
    // already in the AiUsage ledger with its error code and latency.
    console.warn(
      `[ai] ${entryLabel(entry)} ${errorCodeOf(error)} → trying ${entryLabel(models[next])}`
    );
    index = next;
  }

  throw toPublicError(lastError);
}
