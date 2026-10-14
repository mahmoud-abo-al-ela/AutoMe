import type { ZodType } from "zod";
import type { AiPart, AiProvider, ProviderRequest, ProviderResult } from "@/lib/ai/provider/types";
import { errorCodeOf, isRetryableError } from "@/lib/ai/provider/errors";
import { PROVIDERS } from "@/lib/ai/providers";
import type { AiFeature } from "@/lib/ai/features";
import { entryLabel, type ChainEntry, type TokenUsage } from "@/lib/ai/models";
import { reserveRequest } from "@/lib/ai/breaker";
import { meter, ZERO_USAGE } from "@/lib/ai/meter";
import { recordAiFailure } from "@/lib/ai/telemetry";
import { aiSpan } from "@/lib/ai/tracing";
import { recordTrace } from "@/lib/ai/trace";
import { parseFirstJsonObject } from "@/lib/utils/ai-json";
import { ServiceUnavailableError, ValidationError, logError } from "@/lib/utils/errors";
import type { AiCallerContext, AiProgressEvent } from "@/lib/ai/client";

/**
 * One model, driven to a validated reply: the per-attempt timeouts, the
 * retries, and the ledger row, trace and failure record each attempt leaves.
 * lib/ai/client.ts decides which model and key to try; this tries it.
 */

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

export interface AttemptInput<T> {
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
  /** Whether this call keeps a trace of what it was given and replied. */
  traced: boolean;
  promptVersion: string;
}

/** A reply that was not JSON at all — see attemptModel's INVALID_JSON. */
export function isUnreadableReply(error: unknown): boolean {
  return error instanceof ValidationError && error.messageKey === "errors.ai.unreadable";
}

/**
 * The least budget worth starting a follow-up request with — a retry, the
 * next key, the next model. No model answers a structured request in less;
 * starting one would spend a request (billed, metered, rate-limited) whose
 * answer cannot arrive. Checking only for "any time left" let a follow-up
 * start with a millisecond or two to spare, when our own budget timer fired
 * a hair before the clock read the deadline. The first attempt of a call
 * needs only some time left: the caller asked for that one.
 */
export const MIN_FOLLOW_UP_MS = 1_000;

/** Whether a follow-up request is still worth starting before `deadline`. */
export function followUpFits(deadline: number): boolean {
  return deadline - Date.now() >= MIN_FOLLOW_UP_MS;
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
 *
 * Returns the ledger row of the attempt that answered alongside the reply, so
 * what the reply is later judged on can be traced to the call that wrote it.
 */
export async function attemptModel<T>(input: AttemptInput<T>): Promise<{ data: T; usageId: string | null }> {
  const { provider: providerId, model } = input.entry;
  const provider = PROVIDERS[providerId].provider;

  for (let attempt = 1; attempt <= input.maxAttempts; attempt++) {
    const allowance = remainingFor(input);
    // Starting an attempt with no budget left would spend a request the caller
    // can never receive — the function is killed before the reply arrives.
    // A retry needs a useful margin, not just a sliver (MIN_FOLLOW_UP_MS).
    if (allowance <= 0 || (attempt > 1 && !followUpFits(input.deadline))) throw budgetExhausted();
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
    let replyText: string | undefined;

    try {
      const result = await aiSpan(
        "gen_ai.chat",
        `chat ${entryLabel(input.entry)}`,
        {
          "gen_ai.system": providerId,
          "gen_ai.operation.name": "chat",
          "gen_ai.request.model": model,
          "gen_ai.request.max_tokens": input.maxOutputTokens,
          "gen_ai.request.temperature": input.temperature,
          "autome.ai.feature": input.feature,
          "autome.ai.attempt": attempt,
        },
        async (span) => {
          const reply = await callWithTimeout(
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
          span.set({
            "gen_ai.usage.input_tokens": reply.usage.inputTokens,
            "gen_ai.usage.output_tokens": reply.usage.outputTokens + reply.usage.thinkingTokens,
            "gen_ai.usage.cache_read.input_tokens": reply.usage.cachedTokens,
          });
          return reply;
        }
      );
      usage = result.usage;
      replyText = result.text;

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

      // A reply worth reading later: one that answered, or one that came back
      // and could not be used. A refusal or a timeout has nothing to read.
      if (input.traced && (success || errorCode === "INVALID_JSON" || errorCode === "SCHEMA_REJECTED")) {
        await recordTrace({
          aiUsageId: usageId,
          feature: input.feature,
          model: entryLabel(input.entry),
          promptVersion: input.promptVersion,
          parts: input.parts,
          output: replyText,
          errorCode: success ? null : errorCode,
        });
      }

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
export function devLog(message: string) {
  if (process.env.NODE_ENV === "development") console.info(`[ai] ${message}`);
}
