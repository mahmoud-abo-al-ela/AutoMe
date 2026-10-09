import { describe, it, expect, vi, beforeEach } from "vitest";

const redisRef = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/lib/redis", () => ({ getRedis: () => redisRef.current }));

import * as cache from "@/lib/ai/cache";

function fakeRedis() {
  const store = new Map<string, unknown>();
  return {
    store,
    mget: vi.fn(async (...keys: string[]) => keys.map((key) => store.get(key) ?? null)),
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
      return "OK";
    }),
  };
}

beforeEach(() => {
  cache.clear();
  redisRef.current = null;
});

describe("the AI response cache", () => {
  it("serves an answer written by another instance", async () => {
    const redis = fakeRedis();
    redisRef.current = redis;
    await cache.set("k1", { make: "Kia" });
    // Another instance: nothing in its own memory.
    cache.clear();

    expect(await cache.get("k1")).toEqual({ make: "Kia" });
  });

  it("looks the whole chain up in one round trip and returns the first answer in chain order", async () => {
    const redis = fakeRedis();
    redisRef.current = redis;
    await cache.set("fallback-model", "b");
    await cache.set("last-model", "c");
    cache.clear();

    expect(await cache.getFirst(["lead-model", "fallback-model", "last-model"])).toEqual({ value: "b", index: 1 });
    expect(redis.mget).toHaveBeenCalledTimes(1);
  });

  it("answers from memory without asking Redis", async () => {
    const redis = fakeRedis();
    redisRef.current = redis;
    await cache.set("k", 1);

    expect(await cache.get("k")).toBe(1);
    expect(redis.mget).not.toHaveBeenCalled();
  });

  it("treats a Redis failure as a miss, and keeps working in memory", async () => {
    redisRef.current = {
      mget: async () => { throw new Error("redis down"); },
      set: async () => { throw new Error("redis down"); },
    };
    expect(await cache.get("missing")).toBeUndefined();
    await cache.set("k", 2);
    expect(await cache.get("k")).toBe(2);
  });

  it("keeps a large reply out of Redis", async () => {
    const redis = fakeRedis();
    redisRef.current = redis;
    await cache.set("big", { text: "x".repeat(200_000) });
    expect(redis.set).not.toHaveBeenCalled();
  });

  it("works without Redis at all", async () => {
    await cache.set("k", 3);
    expect(await cache.get("k")).toBe(3);
  });
});
