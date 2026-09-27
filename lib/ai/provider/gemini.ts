import { GoogleGenAI, ThinkingLevel, type GenerateContentResponse } from "@google/genai";
import type { TokenUsage } from "@/lib/ai/models";
import type { ProviderRequest, ProviderResult } from "@/lib/ai/provider/types";

/**
 * Google's Gemini API, through its SDK. The only module in the repo that
 * imports `@google/genai`.
 *
 * Nothing here knows about metering, caching, plan gates or Zod — this layer
 * makes one call and reports what came back. The SDK's ApiError carries a
 * numeric `status`, which is what the shared classification in ./errors reads.
 */

let client: GoogleGenAI | null = null;

/**
 * Whether a key is present at all.
 *
 * Checked by callers *before* constructing the client, because the module is
 * imported during `next build` and in CI, where `GEMINI_API_KEY` is the literal
 * string "placeholder". Constructing lazily keeps import-time side effects out
 * of the build.
 */
export function isConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

/** One provider call. No retry, no timeout, no metering — those belong to the client. */
export async function generate(req: ProviderRequest): Promise<ProviderResult> {
  const params = {
    model: req.model,
    contents: [{ role: "user", parts: req.parts }],
    config: {
      temperature: req.temperature ?? 0.2,
      responseMimeType: "application/json",
      ...(req.maxOutputTokens ? { maxOutputTokens: req.maxOutputTokens } : {}),
      ...(req.responseJsonSchema ? { responseJsonSchema: req.responseJsonSchema } : {}),
      // Gemma is served through the same API without Gemini's thinking
      // controls; the setting is left off rather than risking a 400 on the
      // model meant to rescue the call.
      ...(req.thinking === "low" && !req.model.startsWith("gemma-")
        ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
        : {}),
      ...(req.signal ? { abortSignal: req.signal } : {}),
    },
  };

  if (!req.onText) {
    const response = await getClient().models.generateContent(params);
    return { text: response.text, usage: usageOf(response) };
  }

  const stream = await getClient().models.generateContentStream(params);
  let text = "";
  let last: GenerateContentResponse | undefined;
  for await (const chunk of stream) {
    last = chunk;
    const piece = chunk.text;
    if (piece) {
      text += piece;
      req.onText(text);
    }
  }
  // Usage arrives on the final chunk; the running total is what was billed.
  return { text: text || undefined, usage: usageOf(last) };
}

/**
 * Each count is defaulted to 0 because the field is absent on some error and
 * safety-block paths, and `AiUsage` stores non-null Ints.
 */
function usageOf(response: GenerateContentResponse | undefined): TokenUsage {
  const meta = response?.usageMetadata;
  return {
    inputTokens: meta?.promptTokenCount ?? 0,
    outputTokens: meta?.candidatesTokenCount ?? 0,
    thinkingTokens: meta?.thoughtsTokenCount ?? 0,
    cachedTokens: meta?.cachedContentTokenCount ?? 0,
  };
}
