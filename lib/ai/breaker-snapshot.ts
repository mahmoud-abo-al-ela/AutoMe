import type { Redis } from "@upstash/redis";
import { blockFor, capsFor, ledgerUsage, poolLedger, type CapacityPool } from "@/lib/ai/breaker";
import { readRedisWindows, startOfMonthUtc, type Usage } from "@/lib/ai/breaker-windows";
import { PROVIDERS, isProviderId, type ProviderCaps, type ProviderId } from "@/lib/ai/providers";
import { findProviderLedgersSince, sumProviderTokensSince } from "@/lib/repositories/ai-usage";
import { logError } from "@/lib/utils/errors";

export interface KeySnapshot {
  /** As in AiUsage.provider: "google", "google#2", "google:embed". */
  ledger: string;
  provider: ProviderId;
  keyIndex: number;
  pool?: CapacityPool;
  caps: ProviderCaps;
  usage: Usage;
  /** Where the counts came from; "ledger" when Redis was not given or failed. */
  source: "redis" | "ledger";
  /** Why the key would refuse a call now, at each priority; null when it would not. */
  blocked: { standard: string | null; low: string | null };
}

/** "google#2:embed" → google, key 2 (index 1), the embed pool. Null for anything else. */
export function parseLedger(ledger: string): { provider: ProviderId; keyIndex: number; pool?: CapacityPool } | null {
  const [key, pool, ...rest] = ledger.split(":");
  if (rest.length > 0 || (pool !== undefined && pool !== "embed")) return null;
  const [provider, position, ...more] = key.split("#");
  if (more.length > 0 || !isProviderId(provider)) return null;
  const keyIndex = position === undefined ? 0 : Number(position) - 1;
  // poolLedger never writes "#1": the first key is the bare provider id.
  if (!Number.isInteger(keyIndex) || keyIndex < (position === undefined ? 0 : 1)) return null;
  return { provider, keyIndex, ...(pool ? { pool: "embed" as const } : {}) };
}

async function usageOf(
  redis: Redis | null,
  ledger: string,
  caps: ProviderCaps,
  now: number
): Promise<{ usage: Usage; source: KeySnapshot["source"] }> {
  if (redis) {
    try {
      const windows = await readRedisWindows(redis, ledger, now);
      // An unseeded month is the ledger's number; the breaker seeds it, a report must not.
      const tokens =
        caps.monthlyTokens === undefined
          ? 0
          : (windows.monthTokens ?? (await sumProviderTokensSince(ledger, startOfMonthUtc(now))));
      return { usage: { minute: windows.minute, day: windows.day, tokens }, source: "redis" };
    } catch (error) {
      logError("Breaker snapshot could not read Redis; reading the ledger instead", error);
    }
  }
  return { usage: await ledgerUsage(ledger, caps, now), source: "ledger" };
}

export async function breakerSnapshot(redis: Redis | null, now = Date.now()): Promise<KeySnapshot[]> {
  const used = await findProviderLedgersSince(startOfMonthUtc(now));
  const ledgers = [...new Set([...(Object.keys(PROVIDERS) as ProviderId[]), ...used])].sort();

  const snapshots: KeySnapshot[] = [];
  for (const ledger of ledgers) {
    const key = parseLedger(ledger);
    if (!key || poolLedger(key.provider, key.keyIndex, key.pool) !== ledger) continue;
    const caps = capsFor(key.provider, "standard", key.pool);
    const { usage, source } = await usageOf(redis, ledger, caps, now);
    snapshots.push({
      ledger,
      ...key,
      caps,
      usage,
      source,
      blocked: {
        standard: blockFor(ledger, caps, usage),
        low: blockFor(ledger, capsFor(key.provider, "low", key.pool), usage),
      },
    });
  }
  return snapshots;
}
