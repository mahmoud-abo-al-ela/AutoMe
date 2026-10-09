import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { AiPart, AiProvider, ProviderRequest, ProviderResult } from "@/lib/ai/provider/types";
import {
  errorCodeOf,
  isAbortError,
  isCapacityError,
  isModelUnavailableError,
  isProviderUnavailableError,
  isRateLimitError,
  isRetryableError,
} from "@/lib/ai/provider/errors";
import { PROVIDERS, keysFor, ledgerId, type ProviderId } from "@/lib/ai/providers";
import type { AiFeature } from "@/lib/ai/features";
import {
  entryLabel,
  estimateCostMicroUsd,
  modelsFor,
  type ChainEntry,
  type ModelTask,
  type TokenUsage,
} from "@/lib/ai/models";
import { capacityBlock, recordTokens, reserveRequest, type CapacityPriority } from "@/lib/ai/breaker";
import * as cache from "@/lib/ai/cache";
import { createAiUsage } from "@/lib/repositories/ai-usage";
import { recordAiFailure } from "@/lib/ai/telemetry";
import { parseFirstJsonObject } from "@/lib/utils/ai-json";
import {
  ServiceUnavailableError,
  ValidationError,
  AppError,
  logError,
} from "@/lib/utils/errors";

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
  /**
   * The prompt: instructions, sent in the system role. `parts` is then only
   * data — the listing, the question, the photos — which no text inside can
   * promote to an instruction.
   */
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
  /**
   * How long a model may take to START answering before it is treated as
   * queued and the next model in the chain is tried. Applies to every model
   * but the last, which keeps whatever budget is left.
   *
   * Measured on the free tier: a busy model either answers 503 in seconds or
   * accepts the request and queues it for minutes before the first byte — and
   * once it starts, the reply arrives in about a second. So the first byte is
   * the signal that separates "queued" from "working".
   */
  firstTokenTimeoutMs?: number;
  /**
   * How long to wait for capacity when every key is at our own cap, instead
   * of failing "AI busy" at once. For batch work nobody is watching — the
   * evaluation suites, a backfill — where a per-minute cap clears on its own.
   * Never for a request a person is waiting on. Defaults to
   * AI_WAIT_FOR_CAPACITY_MS, which production leaves unset (no wait).
   */
  waitForCapacityMs?: number;
  /**
   * Called with real progress. Setting it also streams the provider reply, so
   * "text" events arrive as the model writes rather than all at once.
   */
  onProgress?: (event: AiProgressEvent) => void;
}

/**
 * Per-attempt ceiling. Measured worst case against the real API is ~17s
 * (gemini-3.5-flash on the bilingual prompt, which spends ~2000 thinking
 * tokens), so 20s leaves headroom without letting one slow model eat a budget
 * that has two more models to fund.
 */
const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Wall-clock budget for the entire call — every model in the chain and every
 * retry inside them.
 *
 * Per-attempt timeouts alone do not bound anything useful: three models at 20s
 * each is a minute, and the platform kills the function long before that. A
 * platform kill is the worst available outcome, because the `finally` that
 * writes the ledger row never runs — the request is spent, invisible to the
 * breaker, and the user gets a bare 504 instead of a typed error. So the budget
 * has to expire *inside* the process, comfortably before the function does.
 *
 * 45s sits under the 60s `maxDuration` the AI route segments declare, leaving
 * room for the upload, the DB writes and the response.
 */
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

/**
 * Most replies this client asks for are small JSON objects. The ceiling exists
 * for the model that loops: gemma-4-26b-a4b ran 11.6 minutes and wrote 176 KB
 * of unterminated JSON when measured on 2026-09-24. Capped, the same failure
 * costs seconds. A feature that writes more passes its own `maxOutputTokens`
 * — the photo read, at 2,000–3,400 tokens by 2026-09-29, was being cut off.
 */
const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

const ZERO_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  thinkingTokens: 0,
  cachedTokens: 0,
};

/** Derived JSON Schemas are stable per Zod schema, so derive each one once. */
const schemaCache = new WeakMap<object, unknown>();

function jsonSchemaFor(schema: ZodType<unknown>): unknown {
  const cached = schemaCache.get(schema as object);
  if (cached) return cached;

  // `$refStrategy: "none"` inlines definitions. Gemini accepts `$ref`/`$defs`
  // only in a limited form, and an inlined schema sidesteps the question.
  const json = zodToJsonSchema(schema, { $refStrategy: "none" }) as Record<
    string,
    unknown
  >;
  // `$schema` is not in the subset the API documents; it is rejected, not ignored.
  delete json.$schema;

  schemaCache.set(schema as object, json);
  return json;
}

/**
 * A model accepted the request but had not started answering by the
 * first-token deadline — it is queued, not broken. Walks the chain like a 503.
 */
export class QueueTimeoutError extends Error {
  readonly code = "QUEUE_TIMEOUT";

  constructor() {
    super("The AI model did not start answering in time");
    this.name = "QueueTimeoutError";
  }
}

/**
 * The key's slot could not be reserved: in-flight requests took the last of
 * its cap since the chain was checked. Nothing was sent and nothing billed;
 * the next key, or the next provider's, may have room.
 */
export class KeyCappedError extends Error {
  readonly code = "KEY_CAPPED";

  constructor() {
    super("This key reached its cap before the request was sent");
    this.name = "KeyCappedError";
  }
}

function timeoutError(): Error {
  const error = new Error("AI request timed out");
  error.name = "AbortError";
  return error;
}

/**
 * Run one provider call under a wall-clock budget.
 *
 * The abort signal is the right mechanism, but the race is kept as well so the
 * budget holds even if the SDK declines to honour the signal — a hung call
 * otherwise pins a serverless invocation until the platform ceiling.
 */
async function callWithTimeout(
  provider: AiProvider,
  apiKey: string,
  req: Omit<ProviderRequest, "signal">,
  timeoutMs: number,
  firstTokenMs?: number
): Promise<ProviderResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let firstTimer: ReturnType<typeof setTimeout> | undefined;

  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(timeoutError());
    }, timeoutMs);
  });

  // Only worth arming when it would fire before the overall ceiling. Watching
  // for the first byte needs the reply streamed, so this streams even when the
  // caller did not ask for text.
  const watchFirstToken = firstTokenMs !== undefined && firstTokenMs < timeoutMs;
  let started = false;
  const queued = watchFirstToken
    ? new Promise<never>((_, reject) => {
        firstTimer = setTimeout(() => {
          if (started) return;
          // Reject BEFORE aborting: abort() rejects the call synchronously, and
          // whichever settles first wins the race — as a plain AbortError it
          // would read as a timeout and never walk the chain.
          reject(new QueueTimeoutError());
          controller.abort();
        }, firstTokenMs);
      })
    : null;

  const onText = watchFirstToken
    ? (text: string) => {
        if (!started) {
          started = true;
          if (firstTimer) clearTimeout(firstTimer);
        }
        req.onText?.(text);
      }
    : req.onText;

  const call = provider.generate({ ...req, onText, signal: controller.signal }, apiKey);
  // When the timeout wins the race, the call's own rejection still arrives and
  // would otherwise surface as an unhandled rejection.
  call.catch(() => {});

  try {
    return await Promise.race(queued ? [call, expiry, queued] : [call, expiry]);
  } finally {
    if (timer) clearTimeout(timer);
    if (firstTimer) clearTimeout(firstTimer);
  }
}

interface MeterInput {
  ctx: AiCallerContext | null | undefined;
  feature: AiFeature;
  provider: ProviderId;
  /** Which key: what AiUsage.provider records and the per-key caps count. */
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
async function meter(input: MeterInput): Promise<string | null> {
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

interface AttemptInput<T> {
  entry: ChainEntry;
  apiKey: string;
  /** Which of the provider's keys — what each attempt reserves a slot on. */
  keyIndex: number;
  ledger: string;
  feature: AiFeature;
  system: string | undefined;
  parts: AiPart[];
  schema: ZodType<T>;
  responseJsonSchema: unknown;
  ctx: AiCallerContext | null | undefined;
  timeoutMs: number;
  /** Absolute epoch-ms cutoff for the whole operation, chain included. */
  deadline: number;
  temperature: number | undefined;
  maxAttempts: number;
  thinking: "low" | undefined;
  maxOutputTokens: number;
  firstTokenMs: number | undefined;
  modelIndex: number;
  modelCount: number;
  emit: (event: AiProgressEvent) => void;
  streaming: boolean;
}

/** How long an attempt may take: its own ceiling, or whatever budget is left. */
/** A reply that was not JSON at all — see attemptModel's INVALID_JSON. */
function isUnreadableReply(error: unknown): boolean {
  return error instanceof ValidationError && error.messageKey === "errors.ai.unreadable";
}

function remainingFor(input: { timeoutMs: number; deadline: number }): number {
  return Math.min(input.timeoutMs, input.deadline - Date.now());
}

function budgetExhausted(): Error {
  return new ServiceUnavailableError("The AI request ran out of time", {
    key: "errors.ai.timeout",
  });
}

/**
 * Drive one model to a validated result, retrying only genuine transients.
 *
 * Throws the *original* error rather than a mapped one, so the caller can still
 * tell a retired model from a broken request and move down the chain.
 *
 * Returns the ledger row of the attempt that answered alongside the reply, so
 * what the reply is later judged on can be traced to the call that wrote it.
 */
async function attemptModel<T>(input: AttemptInput<T>): Promise<{ data: T; usageId: string | null }> {
  const { provider: providerId, model } = input.entry;
  const provider = PROVIDERS[providerId].provider;

  for (let attempt = 1; attempt <= input.maxAttempts; attempt++) {
    const allowance = remainingFor(input);
    // Starting an attempt with no budget left would spend a request the caller
    // can never receive — the function is killed before the reply arrives.
    if (allowance <= 0) throw budgetExhausted();
    // Before anything is sent, so a refused slot costs no request, no row.
    if (!(await reserveRequest(providerId, input.keyIndex, input.ctx?.priority))) throw new KeyCappedError();

    devLog(`→ ${entryLabel(input.entry)}${attempt > 1 ? ` (retry ${attempt})` : ""}`);
    input.emit({
      type: "attempt",
      provider: providerId,
      model,
      modelIndex: input.modelIndex,
      modelCount: input.modelCount,
      retry: attempt > 1,
    });

    const started = Date.now();
    let usage: TokenUsage = ZERO_USAGE;
    let success = false;
    let errorCode: string | null = null;
    let data: T | undefined;
    let usageId: string | null = null;

    try {
      const result = await callWithTimeout(
        provider,
        input.apiKey,
        {
          model,
          system: input.system,
          parts: input.parts,
          responseJsonSchema: input.responseJsonSchema,
          temperature: input.temperature,
          // Each provider maps this to its own control, or leaves it off.
          thinking: input.thinking,
          maxOutputTokens: input.maxOutputTokens,
          onText: input.streaming
            ? (text) => input.emit({ type: "text", text })
            : undefined,
        },
        allowance,
        input.firstTokenMs
      );
      usage = result.usage;

      let parsed: Record<string, unknown>;
      try {
        parsed = parseFirstJsonObject(result.text);
      } catch {
        errorCode = "INVALID_JSON";
        throw new ValidationError(
          "The AI response was not valid JSON",
          "ai_response",
          { key: "errors.ai.unreadable" }
        );
      }

      const validated = input.schema.safeParse(parsed);
      if (!validated.success) {
        errorCode = "SCHEMA_REJECTED";
        // Paths and codes only. The values came out of a user's image and must
        // not reach the logs.
        logError("AI response failed schema validation", {
          feature: input.feature,
          model: entryLabel(input.entry),
          issues: validated.error.issues.map((issue) => ({
            path: issue.path.join("."),
            code: issue.code,
          })),
        });
        throw new ValidationError(
          "The AI response did not match the expected shape",
          "ai_response",
          { key: "errors.ai.invalidResponse" }
        );
      }

      // Returned after the `finally` below, which is what writes the row.
      success = true;
      data = validated.data;
    } catch (error) {
      if (errorCode === null) errorCode = errorCodeOf(error);

      // A response that parsed badly is not retried: the provider already
      // accepted and billed the request, so a second attempt spends another one
      // on identical instructions. It is recorded as a failure so it does not
      // burn the customer's monthly quota — they received nothing usable.
      const providerFault =
        errorCode !== "INVALID_JSON" && errorCode !== "SCHEMA_REJECTED";
      // A queued model is not retried in place: the same queue would answer
      // the same way. The chain moves on instead.
      const canRetry =
        providerFault &&
        !(error instanceof QueueTimeoutError) &&
        isRetryableError(error) &&
        attempt < input.maxAttempts;

      if (!canRetry) throw error;
    } finally {
      const latencyMs = Date.now() - started;

      usageId = await meter({
        ctx: input.ctx,
        feature: input.feature,
        provider: providerId,
        ledger: input.ledger,
        model,
        usage,
        latencyMs,
        success,
        errorCode,
      });

      if (!success) {
        // Aggregates live in the ledger; this is only so a captured exception
        // later in the request carries the provider history behind it.
        await recordAiFailure({
          feature: input.feature,
          model: entryLabel(input.entry),
          errorCode: errorCode ?? "UNKNOWN",
          latencyMs,
          attempt,
        });
      }
    }

    if (success) return { data: data as T, usageId };
  }

  // Unreachable: the final attempt either returns or throws above.
  throw new ServiceUnavailableError("The AI provider could not be reached", {
    key: "errors.ai.unavailable",
  });
}

/**
 * Which model answered, in the dev server's terminal — so a developer trying
 * a feature can see it. Never in production: the AiUsage ledger records every
 * attempt there, and a line per call would only be noise.
 */
function devLog(message: string) {
  if (process.env.NODE_ENV === "development") console.info(`[ai] ${message}`);
}

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

/**
 * Hear about every answered call. The evaluation suites use it to report which
 * model answered each case — a fallback answer is a different experiment.
 * Returns the unsubscribe. A listener that throws never costs the call.
 */
export function subscribeAiCalls(listener: (call: AiCallRecord) => void): () => void {
  callListeners.add(listener);
  return () => callListeners.delete(listener);
}

function announce(feature: AiFeature, meta: AiCallMeta) {
  for (const listener of callListeners) {
    try {
      listener({ feature, ...meta });
    } catch (error) {
      logError("AI call listener threw; ignoring", error);
    }
  }
}

export async function generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
  return (await generateStructuredWithMeta(input)).data;
}

/** generateStructured, plus which model answered and the ledger row it wrote. */
export async function generateStructuredWithMeta<T>(
  input: GenerateStructuredInput<T>
): Promise<{ data: T; meta: AiCallMeta }> {
  const metaFor = (entry: ChainEntry, usageId: string | null, cached: boolean): AiCallMeta => {
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
    // The same model on each of the provider's keys, in order, until one
    // answers. Only a key-shaped refusal moves to the next key: a rejected key
    // or a spent allowance (dead for the rest of this request), or a rate
    // limit (that key's own). Anything else is about the model or the
    // request, and another key would meet it too.
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
        if (isRateLimitError(caught) && deadline - Date.now() > 0) continue;
        break;
      }
    }

    // What earns the next link in the chain: a retired model, a saturated
    // one, a provider whose keys all refused us, or a reply that is not JSON
    // at all (cut off or garbled) — each a statement about *this* model that
    // another may not share. A malformed request fails identically
    // everywhere, and so does a well-formed reply the schema rejects (a photo
    // that is not a car): walking the chain would only spend the quota again.
    const anotherModelMightWork =
      isModelUnavailableError(error) ||
      isCapacityError(error) ||
      isProviderUnavailableError(error) ||
      error instanceof KeyCappedError ||
      isUnreadableReply(error) ||
      error instanceof QueueTimeoutError;
    // A timeout is never retried on the same model — the provider still bills
    // the abandoned work — but it walks on to the next model, even one behind
    // the same gateway: CodeCraft sends each model to a different upstream
    // vendor, and one slow model says nothing about the next (measured: GPT-5.6
    // Luna starts answering ~3 s sooner than Gemini 3.7 Flash).
    const next = anotherModelMightWork || isAbortError(error) ? nextUsable(index) : -1;
    // Falling back is only worth it if there is time to hear the answer.
    const timeLeft = deadline - Date.now() > 0;

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
