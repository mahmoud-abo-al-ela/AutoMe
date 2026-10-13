import { createHash } from "node:crypto";
import { getRedis } from "@/lib/redis";
import { RateLimitError, logError } from "@/lib/utils/errors";

/**
 * Stops a caller sweeping get_car with guessed ids. Car ids are random UUIDs,
 * so a real client almost never asks for one that is not found; a run of
 * misses from one address is a scan. Past MISSES_ALLOWED misses in a window,
 * that address gets "rate_limited" for the rest of it.
 *
 * A second layer under the Arcjet limits, which still hold on their own: with
 * Redis unconfigured or down this guard steps aside and says so in the log.
 */

const WINDOW_SECONDS = 10 * 60;
/** Provisional, like every MCP limit; MCP_RL_CAR_MISSES overrides it. */
const MISSES_ALLOWED = (() => {
  const value = Number(process.env.MCP_RL_CAR_MISSES);
  return Number.isInteger(value) && value > 0 ? value : 20;
})();

/** The window's key: a hash, so no address sits in Redis even for ten minutes. */
function keyFor(ip: string, now: number): string {
  const window = Math.floor(now / (WINDOW_SECONDS * 1000));
  const caller = createHash("sha256").update(ip).digest("hex").slice(0, 24);
  return `mcp:car-miss:${caller}:${window}`;
}

/** Refuse a caller already past the allowance in this window. */
export async function assertNotSweeping(ip: string | null, now: number = Date.now()): Promise<void> {
  const redis = getRedis();
  if (!redis || !ip) return;
  let misses = 0;
  try {
    misses = Number((await redis.get(keyFor(ip, now))) ?? 0);
  } catch (error) {
    logError("MCP sweep guard: reading misses failed; the Arcjet limits still apply", error);
    return;
  }
  if (misses >= MISSES_ALLOWED) {
    throw new RateLimitError("Too many lookups of cars that do not exist", {}, WINDOW_SECONDS);
  }
}

/** Count a not-found lookup against the caller. */
export async function noteMiss(ip: string | null, now: number = Date.now()): Promise<void> {
  const redis = getRedis();
  if (!redis || !ip) return;
  const key = keyFor(ip, now);
  try {
    const pipe = redis.pipeline();
    pipe.incr(key);
    pipe.expire(key, WINDOW_SECONDS);
    await pipe.exec();
  } catch (error) {
    logError("MCP sweep guard: counting a miss failed; the Arcjet limits still apply", error);
  }
}
