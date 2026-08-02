// Maps raw @google/genai / network errors to the app's typed errors. The rest of
// the codebase never sees a raw provider error or message.
import { AppError, RateLimitError } from "@/lib/utils/errors";

/**
 * Translate a provider error into a typed AppError/RateLimitError.
 *
 * The returned error carries two extra hints the retry + breaker layers read:
 *   - `retryable`   — safe to retry with backoff (transient RPM / network).
 *   - `quotaWindow` — "rpm" | "rpd" | undefined, for the free-tier breaker.
 *
 * RPM exhaustion is transient (retry); RPD exhaustion is not (trip the breaker,
 * degrade for the day). When the window is ambiguous we treat it as RPD — a
 * wasted retry against an exhausted daily quota helps nobody.
 */
export function mapGeminiError(error) {
    const status = error?.status ?? error?.code;
    const raw = String(error?.message || "");

    if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(raw)) {
        const quotaWindow = /per\s*minute|PerMinute/i.test(raw) ? "rpm" : "rpd";
        const mapped = new RateLimitError("AI request was rate limited");
        mapped.quotaWindow = quotaWindow;
        mapped.retryable = quotaWindow === "rpm";
        return mapped;
    }

    // Our AbortSignal.timeout firing, or a transient transport failure.
    if (
        error?.name === "AbortError" ||
        /abort|network|fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(raw)
    ) {
        const mapped = new AppError("AI request failed to reach the provider", 503, "AI_UNAVAILABLE");
        mapped.retryable = true;
        return mapped;
    }

    const mapped = new AppError("AI request failed", 502, "AI_ERROR");
    mapped.retryable = false;
    return mapped;
}
