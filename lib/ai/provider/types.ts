import type { TokenUsage } from "@/lib/ai/models";

/**
 * The vendor-neutral shapes every provider speaks. Nothing above
 * `lib/ai/provider/` names a vendor type — which is what lets one chain mix
 * Gemini's SDK with any OpenAI-compatible API.
 */

/** A content part: text, or an image as base64 bytes plus its MIME type. */
export type AiPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

/** An image for the model to look at: base64 bytes plus its declared MIME type. */
export function imagePart(data: string, mimeType: string): AiPart {
  return { inlineData: { data, mimeType } };
}

export function textPart(text: string): AiPart {
  return { text };
}

export interface ProviderRequest {
  model: string;
  /**
   * The instructions, sent in the provider's system role — apart from the
   * user content, which is data. A model without a system role gets them as
   * the first user part instead; see each provider.
   */
  system?: string;
  parts: AiPart[];
  /** JSON Schema for the reply. Every reply this client asks for is JSON. */
  responseJsonSchema?: unknown;
  temperature?: number;
  /**
   * "low" for structured extraction and translation: the answer is constrained
   * by the schema, and default thinking was most of the latency — and bills at
   * the output rate. Each provider maps it to its own control, or ignores it.
   */
  thinking?: "low";
  /** Hard ceiling on the reply, thinking included. */
  maxOutputTokens?: number;
  /**
   * When set, the reply is streamed and this is called with the text received
   * so far after every chunk — the only real progress signal a provider has.
   */
  onText?: (textSoFar: string) => void;
  signal?: AbortSignal;
}

export interface ProviderResult {
  /** Raw model text. Still untrusted — parsing and validation happen upstream. */
  text: string | undefined;
  usage: TokenUsage;
}

/**
 * One provider: one call, made with the key the client chose. No retry, no
 * metering, no key selection — a provider may have several keys, and which one
 * to spend is the client's decision (see keysFor in lib/ai/providers).
 */
export interface AiProvider {
  /**
   * Must throw errors carrying a numeric `status` for HTTP failures, so the
   * shared classification in ./errors decides retry and fallback identically
   * for every provider.
   */
  generate(req: ProviderRequest, apiKey: string): Promise<ProviderResult>;
}
