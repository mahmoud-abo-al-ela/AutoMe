// The single generateContent() call site for structured (JSON) output.
import { getGenAI } from "./client";
import { MODELS } from "./models";
import { mapGeminiError } from "./errors";
import { toGeminiSchema } from "./schema";
import { AppError } from "@/lib/utils/errors";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

/**
 * Retry `fn` with exponential backoff, but only for errors mapGeminiError flags
 * `retryable` (transient RPM / network). A non-retryable error (RPD, safety, bad
 * request) throws immediately — retrying into an exhausted daily quota just wastes
 * latency. Consolidates the ad-hoc retryWithBackoff that lived in actions/home.js
 * (the @google/genai SDK does no retrying of its own).
 */
async function withRetry(fn) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
            return await fn();
        } catch (rawError) {
            const mapped = mapGeminiError(rawError);
            if (!mapped.retryable || attempt === MAX_ATTEMPTS - 1) throw mapped;
            await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        }
    }
}

/**
 * Run one structured-output generation and return a normalized result.
 *
 * @param {object} args
 * @param {import("./models").Capability} args.capability  key into MODELS (model + config)
 * @param {Array}  args.contents                           Gemini `contents` (text and/or inlineData)
 * @param {import("zod").ZodTypeAny} args.schema           response schema (drives responseSchema + re-validation)
 * @returns {Promise<{ data: unknown, usage: object, model: string, latencyMs: number, finishReason: string }>}
 *
 * Throws a typed error (AppError / RateLimitError) on missing key, provider
 * failure, refusal/truncation, or unparseable output. This layer never returns a
 * fallback — callers own graceful degradation and know their own fallback value.
 */
export async function runStructured({ capability, contents, schema }) {
    const ai = getGenAI();
    if (!ai) throw new AppError("AI is not configured", 503, "AI_UNAVAILABLE");

    const { model, generationConfig } = MODELS[capability];
    const startedAt = Date.now();

    const response = await withRetry(() =>
        ai.models.generateContent({
            model,
            contents,
            // NOTE: `config`, not `generationConfig` — the SDK silently ignores the
            // latter (the bug that forced markdown-fence stripping downstream).
            config: {
                ...generationConfig,
                responseMimeType: "application/json",
                responseSchema: toGeminiSchema(schema),
                abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            },
        })
    );

    const latencyMs = Date.now() - startedAt;
    const finishReason = response?.candidates?.[0]?.finishReason;
    const blockReason = response?.promptFeedback?.blockReason;

    // Guard before reading text: a block or a non-STOP finish (SAFETY, RECITATION,
    // MAX_TOKENS) means the text is absent or truncated, and JSON.parse would throw
    // something misleading. This is Gemini's equivalent of a refusal check.
    if (blockReason || (finishReason && finishReason !== "STOP")) {
        const error = new AppError("AI response was blocked or truncated", 502, "AI_NO_OUTPUT");
        error.finishReason = finishReason || blockReason;
        error.retryable = false;
        throw error;
    }

    let parsed;
    try {
        // responseMimeType guarantees raw JSON — no fences, no JSON.parse dance.
        parsed = JSON.parse(response.text);
    } catch {
        throw new AppError("AI response was not valid JSON", 502, "AI_BAD_OUTPUT");
    }

    // Re-validate: schema-shaped output is not semantically safe. The caller's
    // sanitize step is the real trust boundary; this catches gross prompt drift.
    const result = schema.safeParse(parsed);
    if (!result.success) {
        throw new AppError("AI response failed schema validation", 502, "AI_BAD_OUTPUT");
    }

    const usageMetadata = response.usageMetadata || {};
    return {
        data: result.data,
        usage: {
            inputTokens: usageMetadata.promptTokenCount ?? 0,
            outputTokens: usageMetadata.candidatesTokenCount ?? 0,
            thinkingTokens: usageMetadata.thoughtsTokenCount ?? 0,
            cachedTokens: usageMetadata.cachedContentTokenCount ?? 0,
        },
        model,
        latencyMs,
        finishReason: finishReason ?? "STOP",
    };
}
