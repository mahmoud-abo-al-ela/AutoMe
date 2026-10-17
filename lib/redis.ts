import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/** Upstash answers in tens of milliseconds; a second means it is not answering. */
const REDIS_TIMEOUT_MS = 1_000;

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  client = isRedisConfigured()
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        // A failed call falls back to the ledger; retrying in the client only
        // adds latency in front of a request someone is waiting on.
        retry: false,
        // Every AI call waits on Redis before it starts, so a slow Redis must
        // fail fast — a timeout is a fallback, a hang is an outage.
        signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS),
      })
    : null;
  return client;
}

/** Test seam: forget the client, so a test can change the environment. */
export function resetRedisForTests(): void {
  client = undefined;
}
