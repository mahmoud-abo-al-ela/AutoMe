import { createHash } from "node:crypto";

const TTL_MS = 10 * 60_000;
/** Bounded so a burst of distinct uploads cannot grow the heap without limit. */
const MAX_ENTRIES = 100;

interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();

/**
 * Not tenant-scoped, which is safe only because both features are pure
 * functions of the image. ⚠️ A feature whose output depends on anything else —
 * a car record, org settings, locale — must add it to this key, or one tenant's
 * answer will be served to another.
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

export function get<T>(key: string): T | undefined {
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

export function set(key: string, value: unknown): void {
  if (store.size >= MAX_ENTRIES) {
    // Map preserves insertion order and `get` re-inserts, so the first key is
    // the least recently used.
    const oldest = store.keys().next();
    if (!oldest.done) store.delete(oldest.value);
  }
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

/** Test seam — the module-level store would otherwise leak between cases. */
export function clear(): void {
  store.clear();
}
