import * as gemini from "@/lib/ai/provider/gemini";
import { createOpenAiCompatibleProvider } from "@/lib/ai/provider/openai-compatible";
import type { AiProvider } from "@/lib/ai/provider/types";

/**
 * Every AI API the platform can call. **Adding one is three steps:**
 *
 *   1. An entry below — for any OpenAI-compatible API, `kind:
 *      "openai-compatible"`, its base URL and the env var for its key.
 *   2. The key in `.env` locally and in Vercel. A provider whose key is unset
 *      is skipped, so an entry can ship before its key does.
 *   3. `"<id>/<model>"` entries in the task chains in lib/ai/models.ts, or in
 *      an `AI_MODELS_<TASK>` env var to reorder without a deploy.
 *
 * `caps` are OUR limits, kept under the provider's own so the breaker stops us
 * before the provider starts refusing. They are per provider: one API running
 * out skips it and the chain carries on with the next.
 */

export type ProviderId = "codecraft" | "google";

export interface ProviderCaps {
  /** Requests per minute. */
  rpm: number;
  /** Requests per rolling 24 hours, where the provider has a daily limit. */
  rpd?: number;
  /** Tokens per calendar month (UTC), where the plan is sold in tokens. */
  monthlyTokens?: number;
}

interface ProviderEntry {
  /** Stored in AiUsage.provider — never rename one that has ledger rows. */
  id: ProviderId;
  caps: ProviderCaps;
  /** Env prefix for cap overrides: <PREFIX>_MAX_RPM, _MAX_RPD, _MAX_MONTHLY_TOKENS. */
  envPrefix: string;
  /**
   * Whether the reply really arrives token by token. Only then does "no text
   * yet" mean "queued", so only then does a caller's firstTokenTimeoutMs
   * apply; a provider that sends the whole reply at the end is judged by the
   * per-attempt timeout alone.
   */
  streamsIncrementally: boolean;
  /**
   * Per-attempt ceiling when the caller sets none, for a provider slower than
   * the client's 20 s default was calibrated on (Google, ~17 s worst case).
   */
  attemptTimeoutMs?: number;
  provider: AiProvider;
}

export const PROVIDERS: Record<ProviderId, ProviderEntry> = {
  /**
   * CodeCraft: an OpenAI-compatible gateway in front of many vendors' models.
   * Free plan: 60 requests/min and 1M tokens/month — the monthly cap sits a
   * little under that so the last calls of the month are not refused mid-way.
   */
  codecraft: {
    id: "codecraft",
    caps: { rpm: 50, monthlyTokens: 950_000 },
    envPrefix: "AI_CODECRAFT",
    // Measured 2026-09-27: the whole reply arrives in ~3 chunks at the very
    // end (first text 5-8 s = done). A first-token cutoff was killing answers
    // that were about to land — about half of them in the first live run.
    streamsIncrementally: false,
    // Text answers measured 7.6-16.9 s through the gateway; 20 s cut the slow
    // end. Full photo extraction is 30-56 s, but its route sets its own limit.
    attemptTimeoutMs: 30_000,
    provider: createOpenAiCompatibleProvider({
      baseUrl: "https://codecraftapi.com/v1",
      apiKeyEnv: "CODECRAFT_API_KEY",
      lowReasoningEffort: "minimal",
    }),
  },

  /**
   * Google's Gemini API, directly. On the free tier its models are often
   * saturated (7-day ledger to 2026-09-27: 3.7-flash 24% success, 3.6-flash
   * 45%), so it is the fallback rather than the lead.
   */
  google: {
    id: "google",
    caps: { rpm: 10, rpd: 500 },
    // The names these caps have always had, before there was a second provider.
    envPrefix: "AI_GOOGLE",
    streamsIncrementally: true,
    provider: {
      // Resolved per call, so a test mocking the module intercepts it.
      isConfigured: () => gemini.isConfigured(),
      generate: (req) => gemini.generate(req),
    },
  },
};

export function isProviderId(value: string): value is ProviderId {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}
