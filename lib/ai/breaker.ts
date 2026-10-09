import type { Redis } from "@upstash/redis";
import { countPlatformCallsSince, sumProviderTokensSince } from "@/lib/repositories/ai-usage";
import { PROVIDERS, isProviderId, ledgerId, type ProviderCaps, type ProviderId } from "@/lib/ai/providers";
import { getRedis } from "@/lib/redis";
import { logError } from "@/lib/utils/errors";

/**
 * Our own limits in front of each provider's.
 *
 * Per key, because each key has its own allowance: one running out says
 * nothing about the next. The caps are the provider's (every key of a
 * provider is on the same kind of plan); the counts are the key's own. A key
 * at its cap is skipped; only when every key of every provider in a chain is
 * capped is the request refused as "AI busy".
 *
 * Counted in Redis when it is configured: every attempt *reserves* its
 * request before it is sent (INCR, backed out with DECR if that went over the
 * cap), so two requests in flight cannot both take the last slot — reading
 * the ledger and then calling let a burst of parallel requests overshoot
 * together. Without Redis, or when it fails, the caps are read from the usage
 * ledger (AiUsage.provider = ledgerId(provider, keyIndex)) as before: the
 * ledger stays the record either way.
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

/** What one key has used, as the caps measure it. */
interface Usage {
  minute: number;
  day: number;
  tokens: number;
}

function blockFor(ledger: string, caps: ProviderCaps, usage: Usage): string | null {
  if (usage.minute >= caps.rpm) return `${ledger}: ${usage.minute}/${caps.rpm} requests this minute`;
  if (caps.rpd !== undefined && usage.day >= caps.rpd) {
    return `${ledger}: ${usage.day}/${caps.rpd} requests today`;
  }
  if (caps.monthlyTokens !== undefined && usage.tokens >= caps.monthlyTokens) {
    return `${ledger}: ${usage.tokens}/${caps.monthlyTokens} tokens this month`;
  }
  return null;
}

// ---------- Redis counters ----------
// Fixed windows, read so they behave like the rolling ones the ledger gives:
// the minute is this bucket plus the previous one weighted by how much of it
// is still inside the last 60 s; the day is the last 24 hourly buckets.

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

const minuteKey = (ledger: string, bucket: number) => `ai:rpm:${ledger}:${bucket}`;
const hourKey = (ledger: string, bucket: number) => `ai:rph:${ledger}:${bucket}`;
const monthKey = (ledger: string, now: number) => `ai:tok:${ledger}:${new Date(now).toISOString().slice(0, 7)}`;

/** The last 24 hourly buckets, oldest first; the current one last. */
function dayBuckets(ledger: string, now: number): string[] {
  const current = Math.floor(now / HOUR_MS);
  return Array.from({ length: 24 }, (_, i) => hourKey(ledger, current - 23 + i));
}

function minuteEstimate(now: number, current: number, previous: number): number {
  const elapsed = (now % MINUTE_MS) / MINUTE_MS;
  return Math.ceil(current + previous * (1 - elapsed));
}

const total = (values: unknown[]) => values.reduce<number>((sum, value) => sum + Number(value ?? 0), 0);

/**
 * This month's tokens for a key. The first read of a month seeds the counter
 * from the ledger — a deploy mid-month must not start the allowance at zero.
 */
async function monthTokens(redis: Redis, ledger: string, now: number, stored: unknown): Promise<number> {
  if (stored !== null && stored !== undefined) return Number(stored);
  const key = monthKey(ledger, now);
  const fromLedger = await sumProviderTokensSince(ledger, startOfMonthUtc(now));
  // NX: a seed that landed first wins. Forty days outlives the month.
  await redis.set(key, fromLedger, { nx: true, ex: 40 * 24 * 60 * 60 });
  return Number((await redis.get(key)) ?? fromLedger);
}

async function redisUsage(redis: Redis, ledger: string, caps: ProviderCaps, now: number): Promise<Usage> {
  const bucket = Math.floor(now / MINUTE_MS);
  const values = await redis.mget<unknown[]>(
    minuteKey(ledger, bucket),
    minuteKey(ledger, bucket - 1),
    ...dayBuckets(ledger, now),
    monthKey(ledger, now)
  );
  return {
    minute: minuteEstimate(now, Number(values[0] ?? 0), Number(values[1] ?? 0)),
    day: total(values.slice(2, 26)),
    tokens: caps.monthlyTokens === undefined ? 0 : await monthTokens(redis, ledger, now, values[26]),
  };
}

async function ledgerUsage(ledger: string, caps: ProviderCaps, now: number): Promise<Usage> {
  const [minute, day, tokens] = await Promise.all([
    countPlatformCallsSince(new Date(now - MINUTE_MS), ledger),
    caps.rpd === undefined ? Promise.resolve(0) : countPlatformCallsSince(new Date(now - 24 * HOUR_MS), ledger),
    caps.monthlyTokens === undefined ? Promise.resolve(0) : sumProviderTokensSince(ledger, startOfMonthUtc(now)),
  ]);
  return { minute, day, tokens };
}

/**
 * Why one key of a provider cannot take another call right now, or null if it
 * can. Developer-facing; the client turns an all-capped chain into "AI busy".
 * A read, not a reservation: each attempt reserves with reserveRequest.
 */
export async function capacityBlock(
  provider: ProviderId,
  keyIndex = 0,
  priority: CapacityPriority = "standard"
): Promise<string | null> {
  const caps = currentCaps(provider, priority);
  const ledger = ledgerId(provider, keyIndex);
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

/**
 * Take one request's slot on a key, just before it is sent. False when that
 * slot went over the per-minute or daily cap — the slot is given back and the
 * caller moves on to another key. Every attempt reserves, retries included:
 * each one is a request the provider counts.
 *
 * Without Redis there is nothing to reserve against: true, and the ledger
 * check made before the chain started is all the protection there is.
 */
export async function reserveRequest(
  provider: ProviderId,
  keyIndex = 0,
  priority: CapacityPriority = "standard"
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;

  const caps = currentCaps(provider, priority);
  const ledger = ledgerId(provider, keyIndex);
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

/**
 * Count what one request spent against its key's monthly token allowance —
 * successes and failures alike, which the provider meters the same. Never
 * throws: the ledger row is the record, and the counter is seeded from it.
 */
export async function recordTokens(ledger: string, tokens: number): Promise<void> {
  const redis = getRedis();
  if (!redis || tokens <= 0) return;
  // Only a provider sold by the month has a counter — no round trip for one without.
  const provider = ledger.split("#")[0];
  if (!isProviderId(provider) || currentCaps(provider).monthlyTokens === undefined) return;
  try {
    const key = monthKey(ledger, Date.now());
    // Only into a seeded counter: INCRBY on a missing key would start the
    // month from this call and hide everything the ledger already holds.
    if ((await redis.exists(key)) === 1) await redis.incrby(key, tokens);
  } catch (error) {
    logError("AI breaker could not count tokens in Redis", error);
  }
}
