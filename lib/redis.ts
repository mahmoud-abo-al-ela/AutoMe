import { Redis } from "@upstash/redis";

/**
 * Upstash Redis, over HTTP — no connection to hold open, so it suits
 * serverless functions that live for one request.
 *
 * Shared state that must agree across every running instance lives here: the
 * AI breaker's counters and the AI response cache. Optional by design: with
 * the variables unset — local development, CI, a deploy before they are
 * added — each caller falls back to what it did before Redis (the ledger, an
 * in-process cache), so nothing depends on it to work.
 */

let client: Redis | null | undefined;

/** Upstash answers in tens of milliseconds; a second means it is not answering. */
const REDIS_TIMEOUT_MS = 1_000;

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * The client, or null when Redis is not configured. Built on first use, not
 * at import: modules are imported during `next build`, where the variables
 * may be placeholders.
 */
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
