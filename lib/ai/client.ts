import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import * as provider from "@/lib/ai/provider/gemini";
import type { AiPart } from "@/lib/ai/provider/gemini";
import type { AiFeature } from "@/lib/ai/features";
import {
  estimateCostMicroUsd,
  modelsFor,
  supportsThinkingConfig,
  type ModelTask,
  type TokenUsage,
} from "@/lib/ai/models";
import { assertPlatformCapacity, type CapacityPriority } from "@/lib/ai/breaker";
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
  timeoutMs?: number;
  /** Wall-clock ceiling for the whole call. Defaults to AI_REQUEST_BUDGET_MS. */
  budgetMs?: number;
  temperature?: number;
  maxAttempts?: number;
  /** See ProviderRequest.thinking. Skipped for models without the control. */
  thinking?: "low";
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
 * Every reply this client asks for is a small JSON object — the car listing is
 * ~400 output tokens plus ~270 of thinking. The ceiling exists for the model
 * that loops: gemma-4-26b-a4b ran 11.6 minutes and wrote 176 KB of unterminated
 * JSON when measured on 2026-09-24. Capped, the same failure costs seconds.
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
  req: Omit<provider.ProviderRequest, "signal">,
  timeoutMs: number,
  firstTokenMs?: number
): Promise<provider.ProviderResult> {
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

  const call = provider.generate({ ...req, onText, signal: controller.signal });
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
 */
async function meter(input: MeterInput): Promise<void> {
  try {
    await createAiUsage({
      organizationId: input.ctx?.organizationId ?? null,
      userId: input.ctx?.userId ?? null,
      feature: input.feature,
      model: input.model,
      inputTokens: input.usage.inputTokens,
      outputTokens: input.usage.outputTokens,
      thinkingTokens: input.usage.thinkingTokens,
      cachedTokens: input.usage.cachedTokens,
      costMicroUsd: estimateCostMicroUsd(input.model, input.usage),
      latencyMs: input.latencyMs,
      success: input.success,
      errorCode: input.errorCode,
    });
  } catch (error) {
    logError("AiUsage write failed", error);
  }
}

/** Errors thrown by our own validation already carry a key; pass those through. */
function toPublicError(error: unknown): Error {
  if (error instanceof AppError) return error;

  if (provider.isAbortError(error) || error instanceof QueueTimeoutError) {
    return new ServiceUnavailableError("The AI request timed out", {
      key: "errors.ai.timeout",
    });
  }

  return new ServiceUnavailableError("The AI provider could not be reached", {
    key: "errors.ai.unavailable",
  });
}

interface AttemptInput<T> {
  model: string;
  feature: AiFeature;
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
  firstTokenMs: number | undefined;
  modelIndex: number;
  modelCount: number;
  emit: (event: AiProgressEvent) => void;
  streaming: boolean;
}

/** How long an attempt may take: its own ceiling, or whatever budget is left. */
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
 */
async function attemptModel<T>(input: AttemptInput<T>): Promise<T> {
  for (let attempt = 1; attempt <= input.maxAttempts; attempt++) {
    const allowance = remainingFor(input);
    // Starting an attempt with no budget left would spend a request the caller
    // can never receive — the function is killed before the reply arrives.
    if (allowance <= 0) throw budgetExhausted();

    input.emit({
      type: "attempt",
      model: input.model,
      modelIndex: input.modelIndex,
      modelCount: input.modelCount,
      retry: attempt > 1,
    });

    const started = Date.now();
    let usage: TokenUsage = ZERO_USAGE;
    let success = false;
    let errorCode: string | null = null;

    try {
      const result = await callWithTimeout(
        {
          model: input.model,
          parts: input.parts,
          responseJsonSchema: input.responseJsonSchema,
          temperature: input.temperature,
          thinking: supportsThinkingConfig(input.model) ? input.thinking : undefined,
          maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
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
          model: input.model,
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

      success = true;
      return validated.data;
    } catch (error) {
      if (errorCode === null) errorCode = provider.errorCodeOf(error);

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
        provider.isRetryableError(error) &&
        attempt < input.maxAttempts;

      if (!canRetry) throw error;
    } finally {
      const latencyMs = Date.now() - started;

      await meter({
        ctx: input.ctx,
        feature: input.feature,
        model: input.model,
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
          model: input.model,
          errorCode: errorCode ?? "UNKNOWN",
          latencyMs,
          attempt,
        });
      }
    }
  }

  // Unreachable: the final attempt either returns or throws above.
  throw new ServiceUnavailableError("The AI provider could not be reached", {
    key: "errors.ai.unavailable",
  });
}

export async function generateStructured<T>(
  input: GenerateStructuredInput<T>
): Promise<T> {
  if (!provider.isConfigured()) {
    // A config fault, not a user fault — and it must not look like a rate limit.
    throw new ServiceUnavailableError("GEMINI_API_KEY is not configured", {
      key: "errors.ai.unavailable",
    });
  }

  const models = modelsFor(input.task);
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
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
  const deadline = Date.now() + (input.budgetMs ?? budgetFromEnv());

  const keyFor = (model: string) =>
    input.cacheBytes === undefined
      ? null
      : cache.cacheKey({
          feature: input.feature,
          model,
          promptVersion: input.promptVersion,
          bytes: input.cacheBytes,
        });

  // Checked across the whole chain before any call: an answer a fallback model
  // gave earlier is still a valid answer. A hit writes no ledger row, because a
  // row means "a request reached the provider".
  for (const model of models) {
    const key = keyFor(model);
    if (!key) break;

    const hit = cache.get<T>(key);
    if (hit !== undefined) {
      emit({ type: "cached" });
      return hit;
    }
  }

  await assertPlatformCapacity(input.ctx?.priority);

  const responseJsonSchema = jsonSchemaFor(input.schema);
  let lastError: unknown = null;

  for (let index = 0; index < models.length; index++) {
    const model = models[index];

    try {
      const result = await attemptModel({
        model,
        feature: input.feature,
        parts: input.parts,
        schema: input.schema,
        responseJsonSchema,
        ctx: input.ctx,
        timeoutMs,
        deadline,
        temperature: input.temperature,
        maxAttempts,
        thinking: input.thinking,
        // The last model keeps the rest of the budget: there is nowhere left
        // to hand over to, so cutting it short only guarantees a failure.
        firstTokenMs: index < models.length - 1 ? input.firstTokenTimeoutMs : undefined,
        modelIndex: index,
        modelCount: models.length,
        emit,
        streaming: Boolean(input.onProgress),
      });

      const key = keyFor(model);
      if (key) cache.set(key, result);
      return result;
    } catch (error) {
      lastError = error;

      // Two things earn the next link in the chain: a retired model, and a
      // saturated one. Both are statements about *this* model that a different
      // model may not share. A malformed request or an unusable response fails
      // identically on every model, and walking the chain would spend the quota
      // three times to learn that.
      const anotherModelMightWork =
        provider.isModelUnavailableError(error) ||
        provider.isCapacityError(error) ||
        error instanceof QueueTimeoutError;
      // Falling back is only worth it if there is time to hear the answer.
      const timeLeft = deadline - Date.now() > 0;
      const canFallBack =
        index < models.length - 1 && anotherModelMightWork && timeLeft;

      if (!canFallBack) throw toPublicError(error);

      logError(
        `AI model ${model} unusable (${provider.errorCodeOf(error)}); falling back to ${models[index + 1]}`,
        error
      );
    }
  }

  throw toPublicError(lastError);
}
