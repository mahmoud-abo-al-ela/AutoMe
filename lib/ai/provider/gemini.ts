import { GoogleGenAI } from "@google/genai";
import type { TokenUsage } from "@/lib/ai/models";

/**
 * The only module in the repo that imports `@google/genai`.
 *
 * Everything above it speaks in the vendor-neutral shapes below, which is what
 * makes `lib/ai/client.ts` testable without a network and what keeps a future
 * provider swap a single-file change. Nothing here knows about metering,
 * caching, plan gates or Zod — this layer makes one call and reports what came
 * back. See `[[code-craft]]` on keeping vendor SDKs behind a seam.
 */

let client: GoogleGenAI | null = null;

/**
 * Whether a key is present at all.
 *
 * Checked by callers *before* constructing the client, because the module is
 * imported during `next build` and in CI, where `GEMINI_API_KEY` is the literal
 * string "placeholder". Constructing lazily (rather than at module scope, as
 * `actions/cars.ts` used to) keeps import-time side effects out of the build.
 */
export function isConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

/**
 * Vendor-neutral content part. Structurally compatible with the SDK's `Part`,
 * but declared here so nothing above this module names a Google type — which is
 * what makes the seam real rather than nominal.
 */
export type AiPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

/** An image for the model to look at: base64 bytes plus its declared MIME type. */
export function imagePart(data: string, mimeType: string): AiPart {
  return { inlineData: { data, mimeType } };
}

export function textPart(text: string): AiPart {
  return { text };
}

export interface ProviderRequest {
  model: string;
  parts: AiPart[];
  /** JSON Schema for the reply. Paired with `responseMimeType: application/json`. */
  responseJsonSchema?: unknown;
  temperature?: number;
  signal?: AbortSignal;
}

export interface ProviderResult {
  /** Raw model text. Still untrusted — parsing and validation happen upstream. */
  text: string | undefined;
  usage: TokenUsage;
}

/** One provider call. No retry, no timeout, no metering — those belong to the client. */
export async function generate(req: ProviderRequest): Promise<ProviderResult> {
  const response = await getClient().models.generateContent({
    model: req.model,
    contents: [{ role: "user", parts: req.parts }],
    config: {
      temperature: req.temperature ?? 0.2,
      responseMimeType: "application/json",
      ...(req.responseJsonSchema ? { responseJsonSchema: req.responseJsonSchema } : {}),
      ...(req.signal ? { abortSignal: req.signal } : {}),
    },
  });

  const meta = response.usageMetadata;

  // Each count is defaulted to 0 because the field is absent on some error and
  // safety-block paths, and `AiUsage` stores non-null Ints.
  return {
    text: response.text,
    usage: {
      inputTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      thinkingTokens: meta?.thoughtsTokenCount ?? 0,
      cachedTokens: meta?.cachedContentTokenCount ?? 0,
    },
  };
}

/**
 * Statuses worth another attempt against the *same* model: a blip in front of
 * it, not a statement about the model itself.
 *
 * 429 and 503 are deliberately absent. They mean the model is saturated, and
 * repeating the request 200ms later asks the same overloaded model the same
 * question — `isCapacityError` routes those to a different model instead.
 */
const RETRY_SAME_MODEL_STATUSES = new Set([408, 500, 502, 504]);

function statusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : undefined;
}

export function isAbortError(error: unknown): boolean {
  return (error as { name?: string })?.name === "AbortError";
}

/**
 * Whether an attempt is worth repeating.
 *
 * A 4xx other than 408/429 means the request itself is wrong — a bad model id,
 * a rejected key, an oversized image — and repeating it burns the same quota to
 * get the same answer. The previous inline retry in `actions/home.ts` retried
 * everything, which turned one bad request into three.
 *
 * **Timeouts are deliberately not retryable.** Aborting is client-side only:
 * Google still bills the work and still counts the request against the free-tier
 * cap, so retrying doubles the cost of a call that was already too slow to be
 * useful.
 */
export function isRetryableError(error: unknown): boolean {
  if (isAbortError(error)) return false;

  const status = statusOf(error);
  if (status !== undefined) return RETRY_SAME_MODEL_STATUSES.has(status);

  // No status means it never reached the API — DNS, socket, TLS. Worth a retry.
  return true;
}

/**
 * The model is saturated rather than broken.
 *
 * Observed live on `gemini-3.7-flash`: "This model is currently experiencing
 * high demand." Retrying the same model is the one response that cannot help,
 * because the condition is about that model's capacity — a different model in
 * the chain has its own. So these walk the chain instead of retrying.
 */
export function isCapacityError(error: unknown): boolean {
  const status = statusOf(error);
  return status === 429 || status === 503;
}

/**
 * Short, stable string for `AiUsage.errorCode`. Stable matters more than
 * descriptive: the column is grouped in usage reporting, so a message carrying
 * a filename or a timestamp would shatter the grouping.
 */
export function errorCodeOf(error: unknown): string {
  if (isAbortError(error)) return "TIMEOUT";

  const status = statusOf(error);
  if (status !== undefined) return `HTTP_${status}`;

  const code = (error as { code?: unknown })?.code;
  if (typeof code === "string" && code) return code;

  const name = (error as { name?: unknown })?.name;
  if (typeof name === "string" && name) return name;

  return "UNKNOWN";
}

/**
 * Whether the model itself is the problem rather than the request.
 *
 * Google retires a model for an API key without notice — this repo already
 * carries a comment about `gemini-2.5-flash` 404ing for newer keys. Retrying
 * cannot help, but the next model in the chain can, so the client treats this
 * separately from both retryable and fatal errors.
 */
export function isModelUnavailableError(error: unknown): boolean {
  const status = statusOf(error);
  if (status === 404) return true;

  // Some retirements arrive as a 400 naming the model rather than a 404.
  if (status === 400) {
    const message = String(
      (error as { message?: unknown })?.message ?? ""
    ).toLowerCase();
    return (
      message.includes("not found") ||
      message.includes("not supported") ||
      message.includes("is not available") ||
      message.includes("unsupported model")
    );
  }

  return false;
}
