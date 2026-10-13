import { describe, it, expect, vi, beforeEach } from "vitest";

const { getRedis } = vi.hoisted(() => ({ getRedis: vi.fn() }));
vi.mock("@/lib/redis", () => ({ getRedis }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { assertNotSweeping, noteMiss } from "./sweep-guard";
import { RateLimitError } from "@/lib/utils/errors";

/** A Redis double with just what the guard uses. */
function fakeRedis() {
  const store = new Map<string, number>();
  return {
    store,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    pipeline: () => {
      const ops: (() => void)[] = [];
      const pipe = {
        incr: (key: string) => (ops.push(() => store.set(key, (store.get(key) ?? 0) + 1)), pipe),
        expire: () => pipe,
        exec: async () => ops.forEach((op) => op()),
      };
      return pipe;
    },
  };
}

const IP = "203.0.113.7";
const NOW = Date.UTC(2026, 9, 13, 10, 0, 0);

beforeEach(() => vi.clearAllMocks());

describe("the get_car sweep guard", () => {
  it("lets a caller miss up to the allowance, then refuses for the rest of the window", async () => {
    const redis = fakeRedis();
    getRedis.mockReturnValue(redis);
    for (let i = 0; i < 20; i++) {
      await assertNotSweeping(IP, NOW);
      await noteMiss(IP, NOW);
    }
    await expect(assertNotSweeping(IP, NOW)).rejects.toBeInstanceOf(RateLimitError);
    // Another caller, and the next window, start clean.
    await expect(assertNotSweeping("198.51.100.1", NOW)).resolves.toBeUndefined();
    await expect(assertNotSweeping(IP, NOW + 10 * 60_000)).resolves.toBeUndefined();
  });

  it("keeps no address in Redis, only a hash of it", async () => {
    const redis = fakeRedis();
    getRedis.mockReturnValue(redis);
    await noteMiss(IP, NOW);
    expect([...redis.store.keys()].join()).not.toContain(IP);
  });

  it("steps aside without Redis, or when Redis fails — the Arcjet limits still hold", async () => {
    getRedis.mockReturnValue(null);
    await expect(assertNotSweeping(IP)).resolves.toBeUndefined();
    getRedis.mockReturnValue({ get: vi.fn().mockRejectedValue(new Error("down")), pipeline: () => { throw new Error("down"); } });
    await expect(assertNotSweeping(IP)).resolves.toBeUndefined();
    await expect(noteMiss(IP)).resolves.toBeUndefined();
  });
});
