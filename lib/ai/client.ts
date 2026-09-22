import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import * as provider from "@/lib/ai/provider/gemini";
import type { AiPart } from "@/lib/ai/provider/gemini";
import type { AiFeature } from "@/lib/ai/features";
import {
  estimateCostMicroUsd,
  modelsFor,
  type ModelTask,
  type TokenUsage,
} from "@/lib/ai/models";
import { assertPlatformCapacity } from "@/lib/ai/breaker";
import * as cache from "@/lib/ai/cache";
import { createAiUsage } from "@/lib/repositories/ai-usage";
import { parseFirstJsonObject } from "@/lib/utils/ai-json";
import {
  ServiceUnavailableError,
  ValidationError,
  AppError,
  logError,
} from "@/lib/utils/errors";

export interface AiCallerContext {
  organizationId: string | null;
  userId: string | null;
}

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
  temperature?: number;
  maxAttempts?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Two, not three. Every attempt is a request against a free-tier cap, and
 * `isRetryableError` has already excluded the faults a retry cannot fix.
 */
const DEFAULT_MAX_ATTEMPTS = 2;

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
  timeoutMs: number
): Promise<provider.ProviderResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(timeoutError());
    }, timeoutMs);
  });

  const call = provider.generate({ ...req, signal: controller.signal });
  // When the timeout wins the race, the call's own rejection still arrives and
  // would otherwise surface as an unhandled rejection.
  call.catch(() => {});

  try {
    return await Promise.race([call, expiry]);
  } finally {
    if (timer) clearTimeout(timer);
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

  if (provider.isAbortError(error)) {
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
  temperature: number | undefined;
  maxAttempts: number;
}

/**
 * Drive one model to a validated result, retrying only genuine transients.
 *
 * Throws the *original* error rather than a mapped one, so the caller can still
 * tell a retired model from a broken request and move down the chain.
 */
async function attemptModel<T>(input: AttemptInput<T>): Promise<T> {
  for (let attempt = 1; attempt <= input.maxAttempts; attempt++) {
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
        },
        input.timeoutMs
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
      const canRetry =
        providerFault &&
        provider.isRetryableError(error) &&
        attempt < input.maxAttempts;

      if (!canRetry) throw error;
    } finally {
      await meter({
        ctx: input.ctx,
        feature: input.feature,
        model: input.model,
        usage,
        latencyMs: Date.now() - started,
        success,
        errorCode,
      });
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
  const maxAttempts = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

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
    if (hit !== undefined) return hit;
  }

  await assertPlatformCapacity();

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
        temperature: input.temperature,
        maxAttempts,
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
        provider.isModelUnavailableError(error) || provider.isCapacityError(error);
      const canFallBack = index < models.length - 1 && anotherModelMightWork;

      if (!canFallBack) throw toPublicError(error);

      logError(
        `AI model ${model} unusable (${provider.errorCodeOf(error)}); falling back to ${models[index + 1]}`,
        error
      );
    }
  }

  throw toPublicError(lastError);
}
