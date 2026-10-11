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
  findManyCars.mockResolvedValue({ cars: [], pagination: {} });
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
