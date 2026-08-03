// AI quota service - the free-tier request-count circuit breaker (RPD / RPM).
import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import { logError } from "@/lib/utils/errors";

// Self-imposed caps, deliberately BELOW Google's free-tier limits (which Google
// no longer publishes per model). Set these from what the AI Studio dashboard
// actually shows, leaving headroom — a cap we control beats a provider 429.
const DAILY_BUDGET = Number(process.env.AI_DAILY_REQUEST_BUDGET) || 200;
const RPM_BUDGET = Number(process.env.AI_RPM_BUDGET) || 8;

// The daily count changes slowly but is read on every AI request — memoise 60s.
let dailyCache = { at: 0, count: 0 };

function startOfUtcDay() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function getDailyCount() {
    const now = Date.now();
    if (now - dailyCache.at < 60_000) return dailyCache.count;
    const count = await aiUsageRepository.countPlatformCallsSince(startOfUtcDay());
    dailyCache = { at: now, count };
    return count;
}

/**
 * Whether an AI call is allowed under the free-tier request budget.
 *
 * @returns {Promise<{ ok: boolean, reason: "rpd" | "rpm" | null }>}
 *
 * Day is checked before minute so daily exhaustion (the longer degradation)
 * wins. Fails OPEN on a counting error: the AI call has its own guards (Arcjet
 * rate limit ahead of it, and Gemini's own 429 → fallback), so a hiccup in the
 * breaker's count query shouldn't independently disable the feature.
 */
export async function checkQuota() {
    try {
        if ((await getDailyCount()) >= DAILY_BUDGET) {
            return { ok: false, reason: "rpd" };
        }
        const lastMinute = new Date(Date.now() - 60_000);
        if ((await aiUsageRepository.countPlatformCallsSince(lastMinute)) >= RPM_BUDGET) {
            return { ok: false, reason: "rpm" };
        }
        return { ok: true, reason: null };
    } catch (error) {
        logError("AI quota check failed; allowing request", error);
        return { ok: true, reason: null };
    }
}
