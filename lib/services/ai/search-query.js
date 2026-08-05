// Natural-language search: translate free text into structured filters, with a
// three-tier cache (rules -> in-process -> unstable_cache), the free-tier request
// breaker, and metering. Returns filters, never results.
import { unstable_cache } from "next/cache";
import { runStructured } from "@/lib/ai/run";
import { isAiConfigured } from "@/lib/ai/client";
import { SEARCH_FILTERS_PROMPT, SEARCH_FILTERS_PROMPT_VERSION } from "@/lib/ai/prompts/search-filters";
import { carSearchFiltersSchema } from "@/lib/validations/schemas";
import { applyRules } from "./rules";
import { sanitizeFilters, emptyFilters } from "./normalize";
import { checkQuota } from "./quota";
import { recordAiUsage } from "./metering";

const FEATURE = "searchFiltersFromText";
const L1_MAX = 500;
const L1_TTL_MS = 10 * 60_000;
const l1 = new Map(); // normalized query -> { value, expires }

function normalizeQuery(query) {
    return query.toLowerCase().replace(/\s+/g, " ").trim();
}

function l1Get(key) {
    const hit = l1.get(key);
    if (!hit) return null;
    if (hit.expires < Date.now()) {
        l1.delete(key);
        return null;
    }
    return hit.value;
}

function l1Set(key, value) {
    if (l1.size >= L1_MAX) l1.delete(l1.keys().next().value); // evict oldest
    l1.set(key, { value, expires: Date.now() + L1_TTL_MS });
}

// Plain-search fallback === exactly today's behaviour. The feature can never make
// search worse than it is now; at worst it becomes invisible.
function fallback(query, source) {
    return { filters: { ...emptyFilters(), search: query }, interpretation: "", unmapped: [], confidence: 0, source };
}

// The AI call + metering. Wrapped by unstable_cache so a cache hit records neither
// usage nor cost. Rate limiting stays OUTSIDE (it reads headers); the org id is a
// plain argument, so no dynamic request API runs in here.
async function translateWithGemini(query, organizationId) {
    const startedAt = Date.now();
    try {
        const result = await runStructured({
            capability: "searchFilters",
            contents: [{ role: "user", parts: [{ text: `${SEARCH_FILTERS_PROMPT}\n\nUser query: "${query}"` }] }],
            schema: carSearchFiltersSchema,
        });
        const clean = sanitizeFilters(result.data, { rawQuery: query });
        await recordAiUsage({
            organizationId, feature: FEATURE, provider: "google", model: result.model,
            inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens,
            thinkingTokens: result.usage.thinkingTokens, cachedTokens: result.usage.cachedTokens,
            latencyMs: result.latencyMs, success: true,
        });
        return { ...clean, source: "model" };
    } catch (error) {
        await recordAiUsage({
            organizationId, feature: FEATURE, provider: "google", model: "unknown",
            latencyMs: Date.now() - startedAt, success: false, errorCode: error?.code || "AI_ERROR",
        });
        throw error; // don't cache failures; caller returns the plain-search fallback
    }
}

// Defined once at module scope (not per-request): unstable_cache keys on the base
// parts + the call arguments, so `query` and `organizationId` both scope the entry.
// Bump SEARCH_FILTERS_PROMPT_VERSION to invalidate on a prompt change.
const cachedTranslate = unstable_cache(
    translateWithGemini,
    ["ai:nl-search", SEARCH_FILTERS_PROMPT_VERSION],
    { revalidate: 604800, tags: ["ai:nl-search"] } // 7 days; temperature 0 makes it deterministic
);

/**
 * Translate a natural-language query into structured car filters.
 *
 * @param {string} query - already length-validated (nlSearchQuerySchema)
 * @param {object} [opts]
 * @param {string|null} [opts.organizationId] - server-resolved, for metering only
 * @returns {Promise<{ filters, interpretation, unmapped, confidence, source }>}
 *   source: "rules" | "cache" | "model" | "unavailable" | "quota_daily" | "quota_minute" | "fallback"
 */
export async function translateTextToFilters(query, { organizationId = null } = {}) {
    if (!isAiConfigured()) return fallback(query, "unavailable");

    // L0: rules pre-filter — zero AI cost.
    const ruled = applyRules(query);
    if (ruled) return { ...ruled, source: "rules" };

    const key = normalizeQuery(query);

    // L1: in-process cache.
    const cached = l1Get(key);
    if (cached) return { ...cached, source: "cache" };

    // Free-tier request breaker (before the AI call, after the cache lookup).
    const quota = await checkQuota();
    if (!quota.ok) return fallback(query, quota.reason === "rpd" ? "quota_daily" : "quota_minute");

    // L2: cross-request cache around the AI call + metering.
    try {
        const result = await cachedTranslate(key, organizationId);
        l1Set(key, result);
        return result;
    } catch {
        return fallback(query, "fallback");
    }
}
