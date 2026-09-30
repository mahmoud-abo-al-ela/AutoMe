import { describe, it, expect, vi, beforeEach } from "vitest";

const generateContent = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
  ThinkingLevel: { LOW: "LOW" },
}));

import { generate } from "@/lib/ai/provider/gemini";
import { textPart } from "@/lib/ai/provider/types";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = "test";
  generateContent.mockResolvedValue({ text: "{}", usageMetadata: {} });
});

describe("gemini provider", () => {
  it("sends the thinking control to a Gemini model", async () => {
    await generate({ model: "gemini-3.6-flash", parts: [textPart("x")], thinking: "low" });
    expect(generateContent.mock.calls[0][0].config.thinkingConfig).toEqual({ thinkingLevel: "LOW" });
  });

  it("never sends it to a Gemma model, which rejects it", async () => {
    await generate({ model: "gemma-4-31b-it", parts: [textPart("x")], thinking: "low" });
    expect(generateContent.mock.calls[0][0].config).not.toHaveProperty("thinkingConfig");
  });
});
