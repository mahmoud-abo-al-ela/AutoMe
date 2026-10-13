import type { Redis } from "@upstash/redis";

/**
 * The breaker's Redis counters and how they are read: fixed windows, read so
 * they behave like the rolling ones the ledger gives. The minute is this
 * bucket plus the previous one weighted by how much of it is still inside the
 * last 60 s; the day is the last 24 hourly buckets. Shared by the breaker,
 * which also writes them, and breakerSnapshot, which must only read them.
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;

/** What one key has used, as the caps measure it. */
export interface Usage {
  minute: number;
  day: number;
  tokens: number;
}

export const minuteKey = (ledger: string, bucket: number) => `ai:rpm:${ledger}:${bucket}`;
const hourKey = (ledger: string, bucket: number) => `ai:rph:${ledger}:${bucket}`;
export const monthKey = (ledger: string, now: number) => `ai:tok:${ledger}:${new Date(now).toISOString().slice(0, 7)}`;

export function startOfMonthUtc(now: number): Date {
  const date = new Date(now);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** The last 24 hourly buckets, oldest first; the current one last. */
export function dayBuckets(ledger: string, now: number): string[] {
  const current = Math.floor(now / HOUR_MS);
  return Array.from({ length: 24 }, (_, i) => hourKey(ledger, current - 23 + i));
}

export function minuteEstimate(now: number, current: number, previous: number): number {
  const elapsed = (now % MINUTE_MS) / MINUTE_MS;
  return Math.ceil(current + previous * (1 - elapsed));
}

export const total = (values: unknown[]) => values.reduce<number>((sum, value) => sum + Number(value ?? 0), 0);

/**
 * A key's counters in one MGET. `monthTokens` is null when this month's
 * counter has not been seeded yet — what to do about that is the caller's.
 */
export async function readRedisWindows(
  redis: Redis,
  ledger: string,
  now: number
): Promise<{ minute: number; day: number; monthTokens: number | null }> {
  const bucket = Math.floor(now / MINUTE_MS);
  const values = await redis.mget<unknown[]>(
    minuteKey(ledger, bucket),
    minuteKey(ledger, bucket - 1),
    ...dayBuckets(ledger, now),
    monthKey(ledger, now)
  );
  const month = values[26];
  return {
    minute: minuteEstimate(now, Number(values[0] ?? 0), Number(values[1] ?? 0)),
    day: total(values.slice(2, 26)),
    monthTokens: month === null || month === undefined ? null : Number(month),
  };
}
