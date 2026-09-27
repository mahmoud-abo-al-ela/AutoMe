import { countPlatformCallsSince, sumProviderTokensSince } from "@/lib/repositories/ai-usage";
import { PROVIDERS, type ProviderCaps, type ProviderId } from "@/lib/ai/providers";
import { logError } from "@/lib/utils/errors";

/**
 * Our own limits in front of each provider's, read from the usage ledger.
 *
 * Per provider, because each API has its own key and its own allowance: one
 * running out says nothing about the next. A provider at its cap is skipped
 * and the chain carries on; only when every provider in a chain is capped is
 * the request refused as "AI busy".
 */

/**
 * The caps are one pool shared by every tenant. Without a reserve, a burst of
 * free-plan usage would leave paying dealers facing "AI busy", so low-priority
 * calls stop at this percentage of each cap and standard calls may use all of it.
 */
const DEFAULT_LOW_PRIORITY_PERCENT = 60;

/** "low" is for callers not paying for the capacity they use: free-plan dealers. */
export type CapacityPriority = "standard" | "low";

function capFromEnv(names: string[], fallback: number | undefined): number | undefined {
  for (const name of names) {
    const raw = process.env[name];
    if (!raw) continue;

    const parsed = Number.parseInt(raw, 10);
    // A malformed cap must not silently disable the breaker.
    if (!Number.isFinite(parsed) || parsed < 0) {
      logError(`${name} is not a non-negative integer; using default ${fallback}`);
      return fallback;
    }
    return parsed;
  }
  return fallback;
}

export function currentCaps(
  provider: ProviderId,
  priority: CapacityPriority = "standard"
): ProviderCaps {
  const { caps: defaults, envPrefix } = PROVIDERS[provider];
  // Google's caps kept their original names from before there were two providers.
  const legacy = provider === "google";

  const caps: ProviderCaps = {
    rpm: capFromEnv(
      [`${envPrefix}_MAX_RPM`, ...(legacy ? ["AI_MAX_REQUESTS_PER_MINUTE"] : [])],
      defaults.rpm
    )!,
    rpd: capFromEnv(
      [`${envPrefix}_MAX_RPD`, ...(legacy ? ["AI_MAX_REQUESTS_PER_DAY"] : [])],
      defaults.rpd
    ),
    monthlyTokens: capFromEnv([`${envPrefix}_MAX_MONTHLY_TOKENS`], defaults.monthlyTokens),
  };
  if (priority === "standard") return caps;

  // Above 100 would let low priority spend the reserve it exists to protect.
  const percent = Math.min(
    capFromEnv(["AI_LOW_PRIORITY_CAP_PERCENT"], DEFAULT_LOW_PRIORITY_PERCENT)!,
    100
  );
  const share = (cap: number | undefined) =>
    cap === undefined ? undefined : Math.floor((cap * percent) / 100);
  return { rpm: share(caps.rpm)!, rpd: share(caps.rpd), monthlyTokens: share(caps.monthlyTokens) };
}

function startOfMonthUtc(now: number): Date {
  const date = new Date(now);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Why a provider cannot take another call right now, or null if it can.
 * Developer-facing; the client turns an all-capped chain into "AI busy".
 */
export async function capacityBlock(
  provider: ProviderId,
  priority: CapacityPriority = "standard"
): Promise<string | null> {
  const caps = currentCaps(provider, priority);
  const now = Date.now();

  try {
    const [minute, day, tokens] = await Promise.all([
      countPlatformCallsSince(new Date(now - 60_000), provider),
      caps.rpd === undefined
        ? Promise.resolve(0)
        : countPlatformCallsSince(new Date(now - 24 * 60 * 60_000), provider),
      caps.monthlyTokens === undefined
        ? Promise.resolve(0)
        : sumProviderTokensSince(provider, startOfMonthUtc(now)),
    ]);

    if (minute >= caps.rpm) return `${provider}: ${minute}/${caps.rpm} requests this minute`;
    if (caps.rpd !== undefined && day >= caps.rpd) {
      return `${provider}: ${day}/${caps.rpd} requests today`;
    }
    if (caps.monthlyTokens !== undefined && tokens >= caps.monthlyTokens) {
      return `${provider}: ${tokens}/${caps.monthlyTokens} tokens this month`;
    }
    return null;
  } catch (error) {
    // The breaker exists to protect a quota, not to be a second outage.
    logError("AI breaker could not read the usage ledger; allowing the call", error);
    return null;
  }
}
