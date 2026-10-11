import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

const generate = vi.hoisted(() => vi.fn());
const createAiTrace = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/provider/gemini", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/provider/gemini")>()),
  generate,
}));
vi.mock("@/lib/repositories/ai-usage", () => ({
  createAiUsage: async () => ({ id: "usage-1" }),
  countPlatformCallsSince: async () => 0,
  sumProviderTokensSince: async () => 0,
}));
vi.mock("@/lib/repositories/ai-trace", () => ({ createAiTrace, pruneAiTraces: async () => 0 }));

import { generateStructured } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { textPart } from "@/lib/ai/provider/types";

const schema = z.object({ answer: z.string() });
const reply = (text: string) => ({ text, usage: { inputTokens: 1, outputTokens: 1, thinkingTokens: 0, cachedTokens: 0 } });

function ask(overrides: Record<string, unknown> = {}) {
  return generateStructured({
    feature: AI_FEATURES.listingQA,
    task: "textFast",
    system: "the prompt",
    parts: [textPart('"Call me on 0100 123 4567 — what colour?"')],
    schema,
    promptVersion: "v1.en",
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.CODECRAFT_API_KEY;
  process.env.GEMINI_API_KEY = "k";
});
afterEach(() => {
  delete process.env.AI_TRACE_SAMPLE_RATE;
});

describe("AI traces", () => {
  it("keeps every listing-assistant answer, redacted, against its ledger row — never the prompt", async () => {
    generate.mockResolvedValue(reply('{"answer":"White."}'));
    await ask();

    expect(createAiTrace).toHaveBeenCalledTimes(1);
    const [trace] = createAiTrace.mock.calls[0];
    expect(trace).toMatchObject({ aiUsageId: "usage-1", feature: "listingQA", promptVersion: "v1.en", errorCode: null });
    expect(trace.model).toMatch(/^google\//);
    expect(trace.input).toBe('"Call me on [phone] — what colour?"');
    expect(trace.output).toBe('{"answer":"White."}');
    expect(JSON.stringify(trace)).not.toContain("the prompt");
  });

  it("keeps a reply that came back unusable, with why", async () => {
    generate.mockResolvedValue(reply('{"wrong":1}'));
    await expect(ask()).rejects.toThrow();

    expect(createAiTrace.mock.calls[0][0]).toMatchObject({ errorCode: "SCHEMA_REJECTED", output: '{"wrong":1}' });
  });

  it("never traces private content", async () => {
    generate.mockResolvedValue(reply('{"answer":"x"}'));
    await ask({ feature: AI_FEATURES.chatTranslation, privateCache: true });
    expect(createAiTrace).not.toHaveBeenCalled();
  });

  it("samples other features at AI_TRACE_SAMPLE_RATE", async () => {
    generate.mockResolvedValue(reply('{"answer":"x"}'));
    process.env.AI_TRACE_SAMPLE_RATE = "0";
    await ask({ feature: AI_FEATURES.listingQualityCoach, task: "text" });
    expect(createAiTrace).not.toHaveBeenCalled();

    process.env.AI_TRACE_SAMPLE_RATE = "1";
    await ask({ feature: AI_FEATURES.listingQualityCoach, task: "text" });
    expect(createAiTrace).toHaveBeenCalledTimes(1);
  });

  it("never lets a failed trace write cost the answer", async () => {
    generate.mockResolvedValue(reply('{"answer":"White."}'));
    createAiTrace.mockRejectedValue(new Error("db down"));
    await expect(ask()).resolves.toEqual({ answer: "White." });
  });
});
