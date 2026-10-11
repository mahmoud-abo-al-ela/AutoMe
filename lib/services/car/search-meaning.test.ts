import { describe, it, expect, vi, beforeEach } from "vitest";

const embedTexts = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ai/embeddings", () => ({ embedTexts }));
const findManyCars = vi.hoisted(() => vi.fn());
vi.mock("@/lib/repositories/car", () => ({ findManyCars }));
vi.mock("@/lib/repositories/user", () => ({ findUserByClerkIdWithMemberships: vi.fn() }));

import { searchMeaning } from "@/lib/services/car/search-meaning";
import { getCars } from "@/lib/services/car/listing";
import { ServiceUnavailableError } from "@/lib/utils/errors";

beforeEach(() => {
  vi.clearAllMocks();
  embedTexts.mockResolvedValue({ model: "gemini-embedding-2", vectors: [[0.5]] });
  findManyCars.mockResolvedValue({ cars: [], pagination: { total: 0 } });
});

describe("searchMeaning", () => {
  it("embeds the search as a query, briefly, at low priority — anonymous search yields to dealers", async () => {
    expect(await searchMeaning("family car")).toEqual({ vector: [0.5], model: "gemini-embedding-2" });
    expect(embedTexts.mock.calls[0][0]).toMatchObject({
      feature: "carSearchQuery",
      texts: ["family car"],
      task: "query",
      timeoutMs: 1_500,
      ctx: { priority: "low" },
    });
  });

  it("asks for nothing without search text", async () => {
    expect(await searchMeaning("   ")).toBeNull();
    expect(await searchMeaning(undefined)).toBeNull();
    expect(embedTexts).not.toHaveBeenCalled();
  });

  it("gives up quietly when the meaning cannot be had — the words still search", async () => {
    embedTexts.mockRejectedValue(new ServiceUnavailableError("busy"));
    expect(await searchMeaning("family car")).toBeNull();
  });
});

describe("getCars", () => {
  it("hands the search its meaning, and never one the caller sent", async () => {
    await getCars({ search: "family car", meaning: { vector: [9], model: "forged" } } as never, {});
    expect(findManyCars.mock.calls[0][0].meaning).toEqual({ vector: [0.5], model: "gemini-embedding-2" });
  });

  it("leaves a search without text to the plain listing", async () => {
    await getCars({ make: "Kia", meaning: { vector: [9], model: "forged" } } as never, {});
    expect(findManyCars.mock.calls[0][0].meaning).toBeNull();
  });
});

describe("getCars — words that found nothing beside the buyer's filters", () => {
  const page = (total: number) => ({ cars: Array.from({ length: total }, (_, i) => ({ id: `c${i}` })), pagination: { total } });

  it("shows what the filters find instead, and says which words were set aside", async () => {
    findManyCars.mockResolvedValueOnce(page(0)).mockResolvedValueOnce(page(3));
    const result = await getCars({ search: "family", bodyType: "SUV", maxPrice: 1_500_000 }, {});

    expect(result).toMatchObject({ relaxedSearch: "family", pagination: { total: 3 } });
    expect(findManyCars.mock.calls[1][0]).toMatchObject({ search: undefined, meaning: null, bodyType: "SUV", maxPrice: 1_500_000 });
  });

  it("never widens a plain search with nothing else to go on", async () => {
    findManyCars.mockResolvedValueOnce(page(0));
    expect(await getCars({ search: "corola" }, {})).toMatchObject({ relaxedSearch: null });
    expect(findManyCars).toHaveBeenCalledTimes(1);
  });

  it("keeps the words when they found cars", async () => {
    findManyCars.mockResolvedValueOnce(page(2));
    expect(await getCars({ search: "family", bodyType: "SUV" }, {})).toMatchObject({ relaxedSearch: null });
    expect(findManyCars).toHaveBeenCalledTimes(1);
  });

  it("says nothing was set aside when the filters find nothing either", async () => {
    findManyCars.mockResolvedValueOnce(page(0)).mockResolvedValueOnce(page(0));
    expect(await getCars({ search: "family", bodyType: "SUV" }, {})).toMatchObject({ relaxedSearch: null, pagination: { total: 0 } });
  });
});
