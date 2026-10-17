const RETRY_SAME_MODEL_STATUSES = new Set([408, 500, 502, 504]);

function statusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : undefined;
}

export function isAbortError(error: unknown): boolean {
  return (error as { name?: string })?.name === "AbortError";
}

export function isRetryableError(error: unknown): boolean {
  if (isAbortError(error)) return false;

  const status = statusOf(error);
  if (status !== undefined) return RETRY_SAME_MODEL_STATUSES.has(status);

  // No status means it never reached the API — DNS, socket, TLS. Worth a retry.
  return true;
}

export function isCapacityError(error: unknown): boolean {
  const status = statusOf(error);
  return status === 429 || status === 503;
}

/**
 * The key is being rate-limited or its quota is spent. With several keys for
 * one provider, the next key may well be under its own limit.
 */
export function isRateLimitError(error: unknown): boolean {
  return statusOf(error) === 429;
}

export function isProviderUnavailableError(error: unknown): boolean {
  const status = statusOf(error);
  return status === 401 || status === 402 || status === 403;
}

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
