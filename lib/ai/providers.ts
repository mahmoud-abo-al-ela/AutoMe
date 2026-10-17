import * as gemini from "@/lib/ai/provider/gemini";
import { createOpenAiCompatibleProvider } from "@/lib/ai/provider/openai-compatible";
import type { AiProvider } from "@/lib/ai/provider/types";

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
  /** Env var holding the key; further keys in `<VAR>_2`, `<VAR>_3`, … */
  apiKeyEnv: string;
  caps: ProviderCaps;
  /** Env prefix for cap overrides: <PREFIX>_MAX_RPM, _MAX_RPD, _MAX_MONTHLY_TOKENS. */
  envPrefix: string;
  streamsIncrementally: boolean;
  /**
   * Per-attempt ceiling when the caller sets none, for a provider slower than
   * the client's 20 s default was calibrated on (Google, ~17 s worst case).
   */
  attemptTimeoutMs?: number;
  provider: AiProvider;
}

export const PROVIDERS: Record<ProviderId, ProviderEntry> = {
  codecraft: {
    id: "codecraft",
    apiKeyEnv: "CODECRAFT_API_KEY",
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
      lowReasoningEffort: "minimal",
    }),
  },

  google: {
    id: "google",
    apiKeyEnv: "GEMINI_API_KEY",
    caps: { rpm: 10, rpd: 500 },
    // The names these caps have always had, before there was a second provider.
    envPrefix: "AI_GOOGLE",
    streamsIncrementally: true,
    provider: {
      // Resolved per call, so a test mocking the module intercepts it.
      generate: (req, apiKey) => gemini.generate(req, apiKey),
      embed: (req, apiKey) => gemini.embed(req, apiKey),
    },
  },
};

export function keysFor(provider: ProviderId): string[] {
  const env = PROVIDERS[provider].apiKeyEnv;
  const keys = (process.env[env] ?? "").split(",").map((key) => key.trim()).filter(Boolean);
  for (let n = 2; ; n++) {
    const key = process.env[`${env}_${n}`]?.trim();
    if (!key) break;
    keys.push(key);
  }
  return [...new Set(keys)];
}

export function ledgerId(provider: ProviderId, keyIndex: number): string {
  return keyIndex === 0 ? provider : `${provider}#${keyIndex + 1}`;
}

export function isProviderId(value: string): value is ProviderId {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}
