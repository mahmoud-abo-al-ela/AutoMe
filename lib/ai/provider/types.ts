import type { TokenUsage } from "@/lib/ai/models";

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
  system?: string;
  parts: AiPart[];
  /** JSON Schema for the reply. Every reply this client asks for is JSON. */
  responseJsonSchema?: unknown;
  temperature?: number;
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

export type EmbeddingTask = "query" | "document" | "similarity";

export interface EmbedRequest {
  model: string;
  texts: string[];
  /** Vector length; the stored column and every query must agree on it. */
  dimensions: number;
  task: EmbeddingTask;
  signal?: AbortSignal;
}

export interface EmbedResult {
  /** One per input text, in order. */
  vectors: number[][];
}

export interface AiProvider {
  generate(req: ProviderRequest, apiKey: string): Promise<ProviderResult>;
  /** Text to vectors, where the provider offers it; same error contract as generate. */
  embed?(req: EmbedRequest, apiKey: string): Promise<EmbedResult>;
}
