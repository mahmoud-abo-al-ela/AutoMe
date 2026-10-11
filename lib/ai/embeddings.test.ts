import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const embed = vi.hoisted(() => vi.fn());
const createAiUsage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/provider/gemini", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/provider/gemini")>()),
  embed,
}));
vi.mock("@/lib/repositories/ai-usage", () => ({
  createAiUsage,
  countPlatformCallsSince: async () => 0,
  sumProviderTokensSince: async () => 0,
}));

import { embedTexts, EMBEDDING_DIMENSIONS, toVectorLiteral } from "@/lib/ai/embeddings";
import { AI_FEATURES } from "@/lib/ai/features";
import * as cache from "@/lib/ai/cache";
import { ServiceUnavailableError } from "@/lib/utils/errors";

const vector = (seed: number) => Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => (seed + i) / 1000);
const reply = (texts: string[]) => ({ vectors: texts.map((_, i) => vector(i)) });
const run = (texts: string[]) => embedTexts({ feature: AI_FEATURES.questionEmbedding, texts, task: "similarity" });

beforeEach(() => {
  vi.clearAllMocks();
  cache.clear();
  process.env.GEMINI_API_KEY = "k1";
  embed.mockImplementation(async (req: { texts: string[] }) => reply(req.texts));
  createAiUsage.mockResolvedValue({ id: "row" });
});
afterEach(() => {
  delete process.env.GEMINI_API_KEY_2;
  delete process.env.AI_EMBEDDING_MODEL;
});

describe("embedTexts", () => {
  it("embeds in one request, in order, with the pinned model, and meters it in the embedding pool", async () => {
    const { model, vectors } = await run(["a", "b"]);

    expect(model).toBe("gemini-embedding-2");
    expect(vectors).toEqual([vector(0), vector(1)]);
    expect(embed).toHaveBeenCalledTimes(1);
    expect(embed.mock.calls[0][0]).toMatchObject({ model: "gemini-embedding-2", dimensions: 768, task: "similarity" });
    expect(createAiUsage).toHaveBeenCalledTimes(1);
    expect(createAiUsage.mock.calls[0][0]).toMatchObject({
      feature: "questionEmbedding",
      provider: "google:embed",
      model: "gemini-embedding-2",
      success: true,
      inputTokens: 0,
    });
  });

  it("answers a repeated text from the cache, without a request", async () => {
    await run(["same question"]);
    await run(["same question"]);
    expect(embed).toHaveBeenCalledTimes(1);
  });

  it("sends only the texts it has not seen, and keeps the order", async () => {
    await run(["seen"]);
    embed.mockClear();
    embed.mockResolvedValueOnce({ vectors: [vector(9)] });
    const { vectors } = await run(["seen", "new"]);
    expect(embed.mock.calls[0][0].texts).toEqual(["new"]);
    expect(vectors[1]).toEqual(vector(9));
  });

  it("splits a large set into requests of 100", async () => {
    await run(Array.from({ length: 150 }, (_, i) => `q${i}`));
    expect(embed.mock.calls.map((c) => c[0].texts.length)).toEqual([100, 50]);
  });

  it("moves to the next key on a rate limit, never to another model", async () => {
    process.env.GEMINI_API_KEY_2 = "k2";
    embed.mockRejectedValueOnce(Object.assign(new Error("429"), { status: 429 }));
    await run(["x"]);

    expect(embed.mock.calls.map((c) => [c[1], c[0].model])).toEqual([
      ["k1", "gemini-embedding-2"],
      ["k2", "gemini-embedding-2"],
    ]);
    expect(createAiUsage.mock.calls.map((c) => [c[0].provider, c[0].success])).toEqual([
      ["google:embed", false],
      ["google#2:embed", true],
    ]);
  });

  it("gives up on a fault another key would share", async () => {
    process.env.GEMINI_API_KEY_2 = "k2";
    embed.mockRejectedValue(Object.assign(new Error("400"), { status: 400 }));
    await expect(run(["x"])).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(embed).toHaveBeenCalledTimes(1);
  });

  it("uses the model the environment pins", async () => {
    process.env.AI_EMBEDDING_MODEL = "gemini-embedding-001";
    expect((await run(["x"])).model).toBe("gemini-embedding-001");
  });
});

describe("toVectorLiteral", () => {
  it("writes pgvector's text form", () => {
    expect(toVectorLiteral([0.1, -2, 3])).toBe("[0.1,-2,3]");
  });
});
