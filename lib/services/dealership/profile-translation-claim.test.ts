import { describe, it, expect, vi, beforeEach } from "vitest";

const findDealershipProfileText = vi.hoisted(() => vi.fn());
vi.mock("@/lib/repositories/dealership", () => ({ findDealershipProfileText, saveDealershipProfileLanguages: vi.fn() }));
vi.mock("@/lib/services/ai/translateDealershipProfile", () => ({ translateDealershipProfile: vi.fn() }));
const redis = vi.hoisted(() => ({ client: null as null | { set: ReturnType<typeof vi.fn> } }));
vi.mock("@/lib/redis", () => ({ getRedis: () => redis.client }));
vi.mock("@/lib/utils/errors", async (orig) => ({ ...(await orig<object>()), logError: vi.fn() }));

import {
  resetStorefrontTranslationClaimsForTests,
  syncDealershipProfileText,
  syncDealershipProfileTextFromStorefront,
} from "@/lib/services/dealership/profile-translation";

/**
 * A storefront visit that finds untranslated text translates it — one visit
 * per dealership per claim window, not every visit. A started translation
 * shows here as the profile being read (a null read ends it early).
 */

const caller = { organizationId: "org-1", userId: null, priority: "low" as const };
const translationsStarted = () => findDealershipProfileText.mock.calls.length;

beforeEach(() => {
  vi.clearAllMocks();
  resetStorefrontTranslationClaimsForTests();
  redis.client = null;
  findDealershipProfileText.mockResolvedValue(null);
});

describe("syncDealershipProfileTextFromStorefront", () => {
  it("translates once for many simultaneous visits (claim held in Redis)", async () => {
    let held = false;
    redis.client = { set: vi.fn(async () => (held ? null : ((held = true), "OK"))) };

    await Promise.all(Array.from({ length: 5 }, () => syncDealershipProfileTextFromStorefront("org-1", caller)));

    expect(translationsStarted()).toBe(1);
    expect(redis.client.set).toHaveBeenCalledWith("dealership-translation:org-1", "1", { nx: true, ex: 600 });
  });

  it("claims per dealership", async () => {
    await syncDealershipProfileTextFromStorefront("org-1", caller);
    await syncDealershipProfileTextFromStorefront("org-2", caller);
    expect(translationsStarted()).toBe(2);
  });

  it("still claims within this instance when Redis is not configured or fails", async () => {
    await syncDealershipProfileTextFromStorefront("org-1", caller);
    await syncDealershipProfileTextFromStorefront("org-1", caller);
    expect(translationsStarted()).toBe(1);

    resetStorefrontTranslationClaimsForTests();
    redis.client = { set: vi.fn(async () => Promise.reject(new Error("redis down"))) };
    await syncDealershipProfileTextFromStorefront("org-3", caller);
    await syncDealershipProfileTextFromStorefront("org-3", caller);
    expect(translationsStarted()).toBe(2);
  });

  it("never holds back a profile save: that path does not claim", async () => {
    await syncDealershipProfileTextFromStorefront("org-1", caller);
    await syncDealershipProfileText("org-1", caller);
    await syncDealershipProfileText("org-1", caller);
    expect(translationsStarted()).toBe(3);
  });
});
