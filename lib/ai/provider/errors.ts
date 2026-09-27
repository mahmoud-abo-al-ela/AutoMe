/**
 * How a failed provider call is classified — retry it, try another model, try
 * another provider, or give up. Shared by every provider, which is why each one
 * throws errors carrying a numeric HTTP `status`.
 */

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
 * get the same answer.
 *
 * **Timeouts are deliberately not retryable.** Aborting is client-side only:
 * the provider still bills the work and still counts the request against its
 * cap, so retrying doubles the cost of a call that was already too slow.
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
 * The provider as a whole cannot serve us: the key is rejected (401/403) or the
 * account's allowance is spent (402). Every model behind the same key fails the
 * same way, so the client skips the rest of that provider — but another
 * provider, with its own key and allowance, may well work.
 */
export function isProviderUnavailableError(error: unknown): boolean {
  const status = statusOf(error);
  return status === 401 || status === 402 || status === 403;
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
 * Providers retire a model for a key without notice — this repo already
 * carries a comment about `gemini-2.5-flash` 404ing for newer keys. Retrying
 * cannot help, but the next model in the chain can.
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
      message.includes("unsupported model") ||
      message.includes("model_not_found") ||
      message.includes("invalid model")
    );
  }

  return false;
}
