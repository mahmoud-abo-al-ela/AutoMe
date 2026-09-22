
export type ModelTask = "vision";

export const MODELS: Record<ModelTask, string> = {
  vision: process.env.GEMINI_MODEL_VISION || "gemini-3.5-flash",
};

export const FALLBACK_CHAIN: Record<ModelTask, string[]> = {
  vision: [],
};

export function modelFor(task: ModelTask): string {
  return MODELS[task];
}

/** Token counts as the provider reports them, already defaulted to 0. */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
}

/** Micro-USD per one million tokens. */
interface ModelPrice {
  inputPerMTokens: number;
  outputPerMTokens: number;
  /** Google bills thinking tokens separately from output. */
  thinkingPerMTokens: number;
}

const MODEL_PRICES: Record<string, ModelPrice> = {
  "gemini-3.5-flash": { inputPerMTokens: 0, outputPerMTokens: 0, thinkingPerMTokens: 0 },
};

export function estimateCostMicroUsd(model: string, usage: TokenUsage): number {
  const price = MODEL_PRICES[model];
  if (!price) return 0;

  const cost =
    (usage.inputTokens * price.inputPerMTokens +
      usage.outputTokens * price.outputPerMTokens +
      usage.thinkingTokens * price.thinkingPerMTokens) /
    1_000_000;

  return Math.round(cost);
}
