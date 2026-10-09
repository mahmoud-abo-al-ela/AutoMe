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

describe("the system role", () => {
  it("sends the instructions as a system instruction, apart from the data", async () => {
    await generate({ model: "gemini-3.6-flash", system: "Rules.", parts: [textPart("data")] });
    const params = generateContent.mock.calls[0][0];
    expect(params.config.systemInstruction).toBe("Rules.");
    expect(params.contents[0].parts).toEqual([{ text: "data" }]);
  });

  it("gives Gemma, which has no system role, the instructions as the first part", async () => {
    await generate({ model: "gemma-4-31b-it", system: "Rules.", parts: [textPart("data")] });
    const params = generateContent.mock.calls[0][0];
    expect(params.config).not.toHaveProperty("systemInstruction");
    expect(params.contents[0].parts).toEqual([{ text: "Rules." }, { text: "data" }]);
  });
});
