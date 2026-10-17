import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Redis } from "@upstash/redis";

const usage = vi.hoisted(() => ({
  findProviderLedgersSince: vi.fn(),
  countPlatformCallsSince: vi.fn(),
  sumProviderTokensSince: vi.fn(),
}));
vi.mock("@/lib/repositories/ai-usage", () => usage);
// The snapshot must never reach for the app's own client.
vi.mock("@/lib/redis", () => ({
  getRedis: () => {
    throw new Error("breakerSnapshot must not use the app's Redis client");
  },
}));

import { breakerSnapshot, parseLedger } from "@/lib/ai/breaker-snapshot";
import { minuteKey, monthKey } from "@/lib/ai/breaker-windows";

const NOW = new Date("2026-10-10T10:00:05Z").getTime();

function recordingRedis(store: Record<string, number> = {}) {
  const calls: string[] = [];
  const redis = new Proxy(
    {},
    {
      get: (_, command: string) => {
        if (command === "then") return undefined;
        return (...args: string[]) => {
          calls.push(command);
          if (command === "mget") return Promise.resolve(args.map((key) => store[key] ?? null));
          return Promise.resolve("OK");
        };
      },
    }
  ) as unknown as Redis;
  return { redis, calls };
}

beforeEach(() => {
  vi.resetAllMocks();
  usage.findProviderLedgersSince.mockResolvedValue([]);
  usage.countPlatformCallsSince.mockResolvedValue(0);
  usage.sumProviderTokensSince.mockResolvedValue(0);
});

afterEach(() => vi.unstubAllEnvs());

describe("breakerSnapshot", () => {
  it("reads Redis with MGET only — not even the month's seed when it is missing", async () => {
    usage.findProviderLedgersSince.mockResolvedValue(["google", "google#2", "codecraft"]);
    usage.sumProviderTokensSince.mockResolvedValue(1234);
    const { redis, calls } = recordingRedis({ [minuteKey("google", Math.floor(NOW / 60_000))]: 4 });

    const snapshot = await breakerSnapshot(redis, NOW);

    expect(new Set(calls)).toEqual(new Set(["mget"]));
    expect(snapshot.map((key) => key.ledger)).toEqual(["codecraft", "google", "google#2"]);
    expect(snapshot.every((key) => key.source === "redis")).toBe(true);
    expect(snapshot.find((key) => key.ledger === "google")!.usage.minute).toBe(4);
    // codecraft is sold by the month: an unseeded counter is the ledger's sum, read, not written.
    expect(snapshot.find((key) => key.ledger === "codecraft")!.usage.tokens).toBe(1234);
  });

  it("uses a seeded month counter as it stands", async () => {
    const { redis } = recordingRedis({ [monthKey("codecraft", NOW)]: 900_000 });
    const codecraft = (await breakerSnapshot(redis, NOW)).find((key) => key.ledger === "codecraft")!;
    expect(codecraft.usage.tokens).toBe(900_000);
    expect(usage.sumProviderTokensSince).not.toHaveBeenCalled();
  });

  it("reports which keys would refuse a call, at each priority", async () => {
    vi.stubEnv("AI_MAX_REQUESTS_PER_MINUTE", "10");
    const minute = Math.floor(NOW / 60_000);
    // 7 this minute: under the standard cap of 10, over low priority's 60 % (6).
    const { redis } = recordingRedis({ [minuteKey("google", minute)]: 7 });
    const google = (await breakerSnapshot(redis, NOW)).find((key) => key.ledger === "google")!;
    expect(google.blocked.standard).toBeNull();
    expect(google.blocked.low).toMatch(/requests this minute/);
  });

  it("falls back to the ledger without Redis, or when Redis fails", async () => {
    usage.countPlatformCallsSince.mockResolvedValue(3);
    expect((await breakerSnapshot(null, NOW)).every((key) => key.source === "ledger" && key.usage.minute === 3)).toBe(true);

    const failing = { mget: () => Promise.reject(new Error("down")) } as unknown as Redis;
    expect((await breakerSnapshot(failing, NOW)).every((key) => key.source === "ledger")).toBe(true);
  });

  it("covers the embed pool and skips ledgers it does not recognise", async () => {
    usage.findProviderLedgersSince.mockResolvedValue(["google:embed", "openai", "google#1", "google:other"]);
    const ledgers = (await breakerSnapshot(null, NOW)).map((key) => key.ledger);
    expect(ledgers).toEqual(["codecraft", "google", "google:embed"]);
  });
});

describe("parseLedger", () => {
  it("reads what poolLedger writes", () => {
    expect(parseLedger("google")).toEqual({ provider: "google", keyIndex: 0 });
    expect(parseLedger("google#3")).toEqual({ provider: "google", keyIndex: 2 });
    expect(parseLedger("google#2:embed")).toEqual({ provider: "google", keyIndex: 1, pool: "embed" });
    expect(parseLedger("google#1")).toBeNull();
    expect(parseLedger("google#x")).toBeNull();
    expect(parseLedger("nope")).toBeNull();
  });
});
