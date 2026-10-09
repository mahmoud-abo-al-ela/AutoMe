import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const countPlatformCallsSince = vi.hoisted(() => vi.fn());
const sumProviderTokensSince = vi.hoisted(() => vi.fn());
const redisRef = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@/lib/repositories/ai-usage", () => ({ countPlatformCallsSince, sumProviderTokensSince }));
vi.mock("@/lib/redis", () => ({ getRedis: () => redisRef.current }));

import { capacityBlock, recordTokens, reserveRequest } from "@/lib/ai/breaker";

/**
 * Just the Upstash calls the breaker makes, over a Map. Commands in a pipeline
 * run in order, like Upstash's, so a reservation sees its own increment.
 */
function fakeRedis() {
  const store = new Map<string, number>();
  const ops = {
    incr: (k: string) => store.set(k, (store.get(k) ?? 0) + 1).get(k)!,
    decr: (k: string) => store.set(k, (store.get(k) ?? 0) - 1).get(k)!,
    expire: () => 1,
    mget: (...keys: string[]) => keys.map((k) => store.get(k) ?? null),
  };
  return {
    store,
    mget: async (...keys: string[]) => ops.mget(...keys),
    get: async (k: string) => store.get(k) ?? null,
    set: async (k: string, v: number, opts?: { nx?: boolean }) => {
      if (opts?.nx && store.has(k)) return null;
      store.set(k, v);
      return "OK";
    },
    exists: async (k: string) => (store.has(k) ? 1 : 0),
    incrby: async (k: string, by: number) => store.set(k, (store.get(k) ?? 0) + by).get(k),
    pipeline() {
      const queued: (() => unknown)[] = [];
      const pipe = {
        incr: (k: string) => (queued.push(() => ops.incr(k)), pipe),
        decr: (k: string) => (queued.push(() => ops.decr(k)), pipe),
        expire: () => (queued.push(() => ops.expire()), pipe),
        mget: (...keys: string[]) => (queued.push(() => ops.mget(...keys)), pipe),
        exec: async () => queued.map((run) => run()),
      };
      return pipe;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Early in a minute and well inside the month, so no case straddles a window.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-10T10:00:05Z"));
  redisRef.current = null;
  countPlatformCallsSince.mockResolvedValue(0);
  sumProviderTokensSince.mockResolvedValue(0);
});

afterEach(() => vi.useRealTimers());

describe("reserveRequest, with Redis", () => {
  it("lets exactly the cap through when requests race for the last slots", async () => {
    redisRef.current = fakeRedis();
    // Google's default is 10 a minute; twelve at once.
    const results = await Promise.all(Array.from({ length: 12 }, () => reserveRequest("google", 0)));
    expect(results.filter(Boolean)).toHaveLength(10);
  });

  it("gives a refused slot back, so the count stays the requests actually sent", async () => {
    const redis = fakeRedis();
    redisRef.current = redis;
    for (let i = 0; i < 11; i++) await reserveRequest("google", 0);
    const minute = [...redis.store].find(([k]) => k.startsWith("ai:rpm:google:"))!;
    expect(minute[1]).toBe(10);
  });

  it("keeps low priority to its share of the cap", async () => {
    redisRef.current = fakeRedis();
    const results = await Promise.all(Array.from({ length: 10 }, () => reserveRequest("google", 0, "low")));
    expect(results.filter(Boolean)).toHaveLength(6);
  });

  it("counts each key on its own", async () => {
    redisRef.current = fakeRedis();
    for (let i = 0; i < 10; i++) await reserveRequest("google", 0);
    expect(await reserveRequest("google", 0)).toBe(false);
    expect(await reserveRequest("google", 1)).toBe(true);
  });

  it("allows the call when Redis fails — the breaker is not a second outage", async () => {
    redisRef.current = { pipeline: () => ({ incr() { throw new Error("redis down"); } }) };
    expect(await reserveRequest("google", 0)).toBe(true);
  });
});

describe("capacityBlock", () => {
  it("reads the counters from Redis, not the ledger", async () => {
    redisRef.current = fakeRedis();
    for (let i = 0; i < 10; i++) await reserveRequest("google", 0);
    expect(await capacityBlock("google", 0)).toMatch(/10\/10 requests this minute/);
    expect(countPlatformCallsSince).not.toHaveBeenCalled();
  });

  it("reads the ledger when Redis is not configured, as before", async () => {
    countPlatformCallsSince.mockResolvedValue(10);
    expect(await capacityBlock("google", 0)).toMatch(/requests this minute/);
  });

  it("falls back to the ledger when Redis fails", async () => {
    redisRef.current = { mget: async () => { throw new Error("redis down"); } };
    countPlatformCallsSince.mockResolvedValue(10);
    expect(await capacityBlock("google", 0)).toMatch(/requests this minute/);
  });

  it("seeds a month's token counter from the ledger, then counts on top of it", async () => {
    const redis = fakeRedis();
    redisRef.current = redis;
    sumProviderTokensSince.mockResolvedValue(949_000);
    expect(await capacityBlock("codecraft", 0)).toBeNull();

    await recordTokens("codecraft", 2_000);
    expect(await capacityBlock("codecraft", 0)).toMatch(/951000\/950000 tokens this month/);
    expect(sumProviderTokensSince).toHaveBeenCalledTimes(1);
  });

  it("never starts a month's count from one call when it was not seeded", async () => {
    const redis = fakeRedis();
    redisRef.current = redis;
    await recordTokens("codecraft", 5_000);
    expect([...redis.store.keys()].some((k) => k.startsWith("ai:tok:"))).toBe(false);
  });
});

describe("recordTokens", () => {
  it("makes no Redis call for a provider without a monthly allowance", async () => {
    const exists = vi.fn(async () => 1);
    redisRef.current = { exists, incrby: vi.fn() };
    await recordTokens("google", 5_000);
    expect(exists).not.toHaveBeenCalled();
  });
});
