import { GoogleGenAI, ThinkingLevel, type GenerateContentResponse } from "@google/genai";
import type { TokenUsage } from "@/lib/ai/models";
import type { EmbedRequest, EmbedResult, EmbeddingTask, ProviderRequest, ProviderResult } from "@/lib/ai/provider/types";

/** One SDK client per key: a provider may have several. */
const clients = new Map<string, GoogleGenAI>();

export function isConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient(apiKey: string): GoogleGenAI {
  let client = clients.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clients.set(apiKey, client);
  }
  return client;
}

const isGemma = (model: string) => model.startsWith("gemma-");

/** One provider call. No retry, no timeout, no metering — those belong to the client. */
export async function generate(
  req: ProviderRequest,
  apiKey: string = process.env.GEMINI_API_KEY ?? ""
): Promise<ProviderResult> {
  // Gemma is served through the same API without a system role — a
  // systemInstruction is refused with a 400 — so it reads the instructions as
  // the first user part, as every model did before the system role.
  const inline = Boolean(req.system) && isGemma(req.model);
  const params = {
    model: req.model,
    contents: [{ role: "user", parts: inline ? [{ text: req.system! }, ...req.parts] : req.parts }],
    config: {
      ...(req.system && !inline ? { systemInstruction: req.system } : {}),
      temperature: req.temperature ?? 0.2,
      responseMimeType: "application/json",
      ...(req.maxOutputTokens ? { maxOutputTokens: req.maxOutputTokens } : {}),
      ...(req.responseJsonSchema ? { responseJsonSchema: req.responseJsonSchema } : {}),
      // Gemma is served through the same API without Gemini's thinking
      // controls; the setting is left off rather than risking a 400 on the
      // model meant to rescue the call.
      ...(req.thinking === "low" && !isGemma(req.model)
        ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
        : {}),
      ...(req.signal ? { abortSignal: req.signal } : {}),
    },
  };

  if (!req.onText) {
    const response = await getClient(apiKey).models.generateContent(params);
    return { text: response.text, usage: usageOf(response) };
  }

  const stream = await getClient(apiKey).models.generateContentStream(params);
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

const TASK_TYPES: Record<EmbeddingTask, string> = {
  query: "RETRIEVAL_QUERY",
  document: "RETRIEVAL_DOCUMENT",
  similarity: "SEMANTIC_SIMILARITY",
};

/** Texts to vectors, all in one request. No retry or metering — the caller's. */
export async function embed(req: EmbedRequest, apiKey: string): Promise<EmbedResult> {
  const response = await getClient(apiKey).models.embedContent({
    model: req.model,
    contents: req.texts,
    config: {
      outputDimensionality: req.dimensions,
      taskType: TASK_TYPES[req.task],
      ...(req.signal ? { abortSignal: req.signal } : {}),
    },
  });
  const vectors = (response.embeddings ?? []).map((embedding) => embedding.values ?? []);
  if (vectors.length !== req.texts.length || vectors.some((v) => v.length !== req.dimensions)) {
    throw Object.assign(new Error("Embedding response did not match the request"), { code: "EMBEDDING_SHAPE" });
  }
  return { vectors };
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
