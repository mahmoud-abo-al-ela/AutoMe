import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const generate = vi.hoisted(() => vi.fn());
const spans = vi.hoisted(() => [] as { op: string; name: string; attributes: Record<string, unknown> }[]);

vi.mock("@/lib/sentry-enabled", () => ({ sentryEnabled: true }));
vi.mock("@sentry/nextjs", () => ({
  startSpan: (options: { op: string; name: string; attributes: Record<string, unknown> }, run: (span: unknown) => unknown) => {
    const record = { op: options.op, name: options.name, attributes: { ...options.attributes } };
    spans.push(record);
    return run({ setAttributes: (more: Record<string, unknown>) => Object.assign(record.attributes, more) });
  },
  addBreadcrumb: () => {},
}));
vi.mock("@/lib/ai/provider/gemini", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/provider/gemini")>()),
  generate,
}));
// Traces are covered in client.trace.test.ts; here they would only reach for a database.
vi.mock("@/lib/repositories/ai-trace", () => ({ createAiTrace: async () => {}, pruneAiTraces: async () => 0 }));
vi.mock("@/lib/repositories/ai-usage", () => ({
  createAiUsage: async () => ({ id: "row-1" }),
  countPlatformCallsSince: async () => 0,
  sumProviderTokensSince: async () => 0,
}));

import { generateStructured } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { textPart } from "@/lib/ai/provider/types";

beforeEach(() => {
  spans.length = 0;
  delete process.env.CODECRAFT_API_KEY;
  process.env.GEMINI_API_KEY = "k";
  generate.mockResolvedValue({
    text: '{"answer":"REPLY-CONTENT"}',
    usage: { inputTokens: 120, outputTokens: 30, thinkingTokens: 5, cachedTokens: 100 },
  });
});

describe("AI spans", () => {
  it("record the call and each attempt with gen_ai attributes, and no content at all", async () => {
    await generateStructured({
      feature: AI_FEATURES.listingQA,
      task: "textFast",
      system: "PROMPT-CONTENT",
      parts: [textPart("BUYER-CONTENT")],
      schema: z.object({ answer: z.string() }),
      promptVersion: "v1",
    });

    expect(spans.map((s) => s.op)).toEqual(["gen_ai.invoke", "gen_ai.chat"]);
    const [call, attempt] = spans;
    expect(call.attributes).toMatchObject({ "autome.ai.feature": "listingQA", "gen_ai.system": "google", "autome.ai.cached": false });
    expect(attempt.attributes).toMatchObject({
      "gen_ai.system": "google",
      "gen_ai.usage.input_tokens": 120,
      "gen_ai.usage.output_tokens": 35,
      "gen_ai.usage.cache_read.input_tokens": 100,
    });

    const everything = JSON.stringify(spans);
    for (const content of ["PROMPT-CONTENT", "BUYER-CONTENT", "REPLY-CONTENT"]) {
      expect(everything).not.toContain(content);
    }
  });
});
