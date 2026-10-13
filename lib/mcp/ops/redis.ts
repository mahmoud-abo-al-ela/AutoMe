import { Redis } from "@upstash/redis";

/**
 * The ops server's Redis, for the breaker's counters: Upstash's read-only
 * token (the database's "Read-Only Token"), under its own variables so the
 * app's write token is never the one used — confineToReadOnly drops that one.
 * Without both variables, none: the breaker is then read from the ledger.
 * Only breakerSnapshot uses it, and it sends MGET alone.
 */
export function readOnlyRedis(env: Record<string, string | undefined>): Redis | null {
  const url = env.OPS_MCP_REDIS_REST_URL;
  const token = env.OPS_MCP_REDIS_READ_ONLY_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token, retry: false, signal: () => AbortSignal.timeout(2_000) });
}
