import { createHash } from "node:crypto";
import { getRedis } from "@/lib/redis";
import { logError } from "@/lib/utils/errors";

/**
 * The AI response cache: a repeat of the same request is answered without a
 * provider call. In Redis when it is configured, so a repeat landing on another
 * serverless instance — most of them, under load — still hits; with a small
 * in-process copy in front, and on its own when Redis is absent or fails.
 */

const TTL_MS = 10 * 60_000;
/** Bounded so a burst of distinct uploads cannot grow the heap without limit. */
const MAX_ENTRIES = 100;
/** Bigger replies stay local: a cache is not worth a megabyte over the wire. */
const MAX_SHARED_BYTES = 100_000;
const PREFIX = "ai:cache:";

interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();

/**
 * Not tenant-scoped, which is safe only because each feature keys on
 * everything its answer depends on. ⚠️ A feature whose output depends on
 * anything else — a car record, org settings, locale — must add it to this
 * key, or one tenant's answer will be served to another.
 */
export function cacheKey(input: {
  feature: string;
  model: string;
  promptVersion: string;
  bytes: Buffer | string;
}): string {
  const hash = createHash("sha256");
  hash.update(input.feature);
  hash.update("\0");
  hash.update(input.model);
  hash.update("\0");
  hash.update(input.promptVersion);
  hash.update("\0");
  hash.update(input.bytes);
  return hash.digest("hex");
}

function getLocal<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }

  // Refresh recency so the eviction below is LRU rather than insertion-ordered.
  store.delete(key);
  store.set(key, entry);
  return entry.value as T;
}

function setLocal(key: string, value: unknown): void {
  if (store.size >= MAX_ENTRIES) {
    // Map preserves insertion order and `getLocal` re-inserts, so the first
    // key is the least recently used.
    const oldest = store.keys().next();
    if (!oldest.done) store.delete(oldest.value);
  }
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

/**
 * `shared: false` keeps a feature's replies in this process only — for
 * private content, like a chat message between a buyer and a dealer, that has
 * no business in a store outside the app.
 */
export interface CacheOptions {
  shared?: boolean;
}

/**
 * The first of these keys that has an answer, in order, and its index — one
 * round trip for the whole chain, not one per model. A Redis failure is a
 * miss: the provider is still there.
 */
export async function getFirst<T>(
  keys: string[],
  { shared = true }: CacheOptions = {}
): Promise<{ value: T; index: number } | undefined> {
  for (const [index, key] of keys.entries()) {
    const local = getLocal<T>(key);
    if (local !== undefined) return { value: local, index };
  }

  const redis = shared ? getRedis() : null;
  if (!redis || keys.length === 0) return undefined;
  try {
    const values = await redis.mget<(T | null)[]>(...keys.map((key) => PREFIX + key));
    const index = values.findIndex((value) => value !== null && value !== undefined);
    if (index < 0) return undefined;
    setLocal(keys[index], values[index]);
    return { value: values[index] as T, index };
  } catch (error) {
    logError("AI cache could not read Redis; treating it as a miss", error);
    return undefined;
  }
}

export async function get<T>(key: string, options?: CacheOptions): Promise<T | undefined> {
  return (await getFirst<T>([key], options))?.value;
}

export async function set(key: string, value: unknown, { shared = true }: CacheOptions = {}): Promise<void> {
  setLocal(key, value);

  const redis = shared ? getRedis() : null;
  if (!redis) return;
  try {
    if (JSON.stringify(value).length > MAX_SHARED_BYTES) return;
    await redis.set(PREFIX + key, value, { px: TTL_MS });
  } catch (error) {
    logError("AI cache could not write Redis; kept locally", error);
  }
}

/** Test seam — the module-level store would otherwise leak between cases. */
export function clear(): void {
  store.clear();
}
