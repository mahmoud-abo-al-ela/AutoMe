import type { Redis } from "@upstash/redis";
import { countPlatformCallsSince, sumProviderTokensSince } from "@/lib/repositories/ai-usage";
import { PROVIDERS, isProviderId, ledgerId, type ProviderCaps, type ProviderId } from "@/lib/ai/providers";
import {
  HOUR_MS,
  MINUTE_MS,
  dayBuckets,
  minuteEstimate,
  minuteKey,
  monthKey,
  readRedisWindows,
  startOfMonthUtc,
  total,
  type Usage,
} from "@/lib/ai/breaker-windows";
import { getRedis } from "@/lib/redis";
import { logError } from "@/lib/utils/errors";

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

export type CapacityPool = "embed";

const DEFAULT_EMBED_CAPS: ProviderCaps = { rpm: 60, rpd: 1_000 };

/** The caps a pool answers to; the provider's own caps when there is none. */
export function capsFor(provider: ProviderId, priority: CapacityPriority, pool?: CapacityPool): ProviderCaps {
  if (!pool) return currentCaps(provider, priority);
  return {
    rpm: capFromEnv(["AI_EMBED_MAX_RPM"], DEFAULT_EMBED_CAPS.rpm)!,
    rpd: capFromEnv(["AI_EMBED_MAX_RPD"], DEFAULT_EMBED_CAPS.rpd),
  };
}

/** How a key's pool appears in AiUsage.provider: "google", "google#2:embed". */
export function poolLedger(provider: ProviderId, keyIndex: number, pool?: CapacityPool): string {
  const ledger = ledgerId(provider, keyIndex);
  return pool ? `${ledger}:${pool}` : ledger;
}

/**
 * Why a key at these caps cannot take another call, or null if it can.
 * Also read by breakerSnapshot, which reports it without acting on it.
 */
export function blockFor(ledger: string, caps: ProviderCaps, usage: Usage): string | null {
  if (usage.minute >= caps.rpm) return `${ledger}: ${usage.minute}/${caps.rpm} requests this minute`;
  if (caps.rpd !== undefined && usage.day >= caps.rpd) {
    return `${ledger}: ${usage.day}/${caps.rpd} requests today`;
  }
  if (caps.monthlyTokens !== undefined && usage.tokens >= caps.monthlyTokens) {
    return `${ledger}: ${usage.tokens}/${caps.monthlyTokens} tokens this month`;
  }
  return null;
}

async function seedMonthTokens(redis: Redis, ledger: string, now: number): Promise<number> {
  const key = monthKey(ledger, now);
  const fromLedger = await sumProviderTokensSince(ledger, startOfMonthUtc(now));
  // NX: a seed that landed first wins. Forty days outlives the month.
  await redis.set(key, fromLedger, { nx: true, ex: 40 * 24 * 60 * 60 });
  return Number((await redis.get(key)) ?? fromLedger);
}

async function redisUsage(redis: Redis, ledger: string, caps: ProviderCaps, now: number): Promise<Usage> {
  const windows = await readRedisWindows(redis, ledger, now);
  if (caps.monthlyTokens === undefined) return { minute: windows.minute, day: windows.day, tokens: 0 };
  const tokens = windows.monthTokens ?? (await seedMonthTokens(redis, ledger, now));
  return { minute: windows.minute, day: windows.day, tokens };
}

/** The same usage from the ledger alone: SELECTs only. Also breakerSnapshot's fallback. */
export async function ledgerUsage(ledger: string, caps: ProviderCaps, now: number): Promise<Usage> {
  const [minute, day, tokens] = await Promise.all([
    countPlatformCallsSince(new Date(now - MINUTE_MS), ledger),
    caps.rpd === undefined ? Promise.resolve(0) : countPlatformCallsSince(new Date(now - 24 * HOUR_MS), ledger),
    caps.monthlyTokens === undefined ? Promise.resolve(0) : sumProviderTokensSince(ledger, startOfMonthUtc(now)),
  ]);
  return { minute, day, tokens };
}

export async function capacityBlock(
  provider: ProviderId,
  keyIndex = 0,
  priority: CapacityPriority = "standard",
  pool?: CapacityPool
): Promise<string | null> {
  const caps = capsFor(provider, priority, pool);
  const ledger = poolLedger(provider, keyIndex, pool);
  const now = Date.now();

  const redis = getRedis();
  if (redis) {
    try {
      return blockFor(ledger, caps, await redisUsage(redis, ledger, caps, now));
    } catch (error) {
      logError("AI breaker could not read Redis; reading the ledger instead", error);
    }
  }

  try {
    return blockFor(ledger, caps, await ledgerUsage(ledger, caps, now));
  } catch (error) {
    // The breaker exists to protect a quota, not to be a second outage.
    logError("AI breaker could not read the usage ledger; allowing the call", error);
    return null;
  }
}

export async function reserveRequest(
  provider: ProviderId,
  keyIndex = 0,
  priority: CapacityPriority = "standard",
  pool?: CapacityPool
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;

  const caps = capsFor(provider, priority, pool);
  const ledger = poolLedger(provider, keyIndex, pool);
  const now = Date.now();
  const bucket = Math.floor(now / MINUTE_MS);
  const minute = minuteKey(ledger, bucket);
  const hours = dayBuckets(ledger, now);
  const hour = hours[hours.length - 1];

  try {
    const pipe = redis.pipeline();
    pipe.incr(minute);
    pipe.expire(minute, 2 * 60);
    pipe.incr(hour);
    pipe.expire(hour, 25 * 60 * 60);
    pipe.mget(minuteKey(ledger, bucket - 1), ...hours.slice(0, -1));
    const [taken, , takenThisHour, , earlier] = (await pipe.exec()) as [number, unknown, number, unknown, unknown[]];

    const usedMinute = minuteEstimate(now, Number(taken), Number(earlier[0] ?? 0));
    const usedDay = Number(takenThisHour) + total(earlier.slice(1));
    // Over, not at: this request is already counted.
    if (usedMinute > caps.rpm || (caps.rpd !== undefined && usedDay > caps.rpd)) {
      const giveBack = redis.pipeline();
      giveBack.decr(minute);
      giveBack.decr(hour);
      await giveBack.exec();
      return false;
    }
    return true;
  } catch (error) {
    logError("AI breaker could not reserve in Redis; allowing the call", error);
    return true;
  }
}

export async function recordTokens(ledger: string, tokens: number): Promise<void> {
  const redis = getRedis();
  if (!redis || tokens <= 0) return;
  // Only a provider sold by the month has a counter — no round trip for one
  // without, nor for a pool (`google:embed`), which is metered by requests.
  const provider = ledger.split("#")[0];
  if (ledger.includes(":") || !isProviderId(provider) || currentCaps(provider).monthlyTokens === undefined) return;
  try {
    const key = monthKey(ledger, Date.now());
    // Only into a seeded counter: INCRBY on a missing key would start the
    // month from this call and hide everything the ledger already holds.
    if ((await redis.exists(key)) === 1) await redis.incrby(key, tokens);
  } catch (error) {
    logError("AI breaker could not count tokens in Redis", error);
  }
}
