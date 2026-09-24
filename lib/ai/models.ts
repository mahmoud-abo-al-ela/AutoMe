/**
 * Model registry and cost table.
 *
 * Call sites ask for a *task*, never a model id. Two reasons, both learned here:
 * Google retires a model for a key without notice (the repo already carries a
 * comment that `gemini-2.5-flash` 404s for newer keys), and the id used to be
 * duplicated across two action files under a note asking the next editor to
 * keep them in sync.
 *
 * Each task resolves to an ordered chain, not a single id. The client walks it
 * when a model turns out to be unavailable, so a retirement degrades to the
 * next model instead of a failed upload.
 */

export type ModelTask = "vision" | "visionFast" | "text";

/** Per-task env override. Set one to pin a model without a deploy of new code. */
const ENV_KEYS: Record<ModelTask, string> = {
  vision: "GEMINI_MODEL_VISION",
  visionFast: "GEMINI_MODEL_VISION_FAST",
  text: "GEMINI_MODEL_TEXT",
};

/**
 * Chains are ordered best-match first, then strictly downward in capability.
 * Every entry is available on the free tier.
 *
 * `vision` is the dealer-facing extraction: thirteen fields off one photo,
 * where a wrong year or price ends up in a public listing. Worth the better
 * model. Not the very newest — the top-end Flash is tuned for long-horizon
 * agentic work this task has no use for, and its extra thinking tokens are
 * billed at the output rate and counted against the same free-tier quota.
 *
 * `visionFast` is the public hero search: three fields, unauthenticated, and
 * the highest-volume AI path in the product. Flash-Lite is built for exactly
 * this shape of work, and keeping it off the main model means a burst of photo
 * searches cannot crowd out dealers uploading inventory.
 *
 * `text` is listing translation between Arabic and English. No image, but the
 * Arabic is published under the dealer's name, and the full Flash models are the
 * ones verified to write natural Egyptian-register Arabic — so the same chain
 * as `vision`, not Flash-Lite.
 *
 * **Gemma 4 closes every chain.** Same API key, free, reads images, and served
 * from separate capacity to the Flash models — which on 2026-09-24 were all
 * either answering 503 or queueing requests for 75–270 s before the first byte.
 * It is weaker than Flash at identifying a car, so it is the fallback, never
 * the first choice: reached only when every Flash model is busy or queued.
 * 31B is the stronger; 26B-A4B (a mixture of experts) is the lighter backstop.
 */
const GEMMA_FALLBACK = ["gemma-4-31b-it", "gemma-4-26b-a4b-it"];

const DEFAULT_CHAINS: Record<ModelTask, string[]> = {
  vision: ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", ...GEMMA_FALLBACK],
  visionFast: [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    // Lighter first here: the public search wants an answer, not the best one.
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it",
  ],
  text: ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", ...GEMMA_FALLBACK],
};

/**
 * Whether a model accepts `thinkingConfig`. Gemma is an open model served
 * through the same API but without Gemini's thinking controls, so the setting
 * is left off for it rather than risking a 400 on the one model meant to rescue
 * the call.
 */
export function supportsThinkingConfig(model: string): boolean {
  return !model.startsWith("gemma-");
}

/**
 * Models to try for a task, best first. An env override takes the lead but does
 * not remove the chain behind it — pinning a model should not also remove the
 * fallback that keeps the feature working when the pin is wrong.
 */
export function modelsFor(task: ModelTask): string[] {
  const chain = DEFAULT_CHAINS[task];
  const override = process.env[ENV_KEYS[task]];
  if (!override) return chain;

  return [override, ...chain.filter((model) => model !== override)];
}

/** The model a task prefers. */
export function modelFor(task: ModelTask): string {
  return modelsFor(task)[0];
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
  input: number;
  output: number;
  /** Tokens served from context cache, billed below the input rate. */
  cached: number;
}

/**
 * Published paid-tier rates, in micro-USD per million tokens.
 *
 * Recorded even though this project runs free, because the table is the seam:
 * switching to a billed key is setting AI_BILLING_MODE, not threading a new
 * concept through the client. Thinking tokens are deliberately absent as a
 * separate rate — Google bills them at the *output* rate ("Output price
 * (including thinking tokens)"), which is worth stating because the AiUsage
 * column comment claims they are billed separately.
 *
 * ⚠️ These are the rates in force through 2026-12-31. The 3.x Flash models
 * double on 2027-01-01. Revisit rather than trusting this table after that.
 */
const PRICES: Record<string, ModelPrice> = {
  "gemini-3.8-flash": { input: 750_000, output: 3_750_000, cached: 75_000 },
  "gemini-3.7-flash": { input: 750_000, output: 3_750_000, cached: 75_000 },
  "gemini-3.6-flash": { input: 750_000, output: 3_750_000, cached: 75_000 },
  "gemini-3.5-flash": { input: 1_500_000, output: 9_000_000, cached: 150_000 },
  "gemini-3.5-flash-lite": { input: 300_000, output: 2_500_000, cached: 30_000 },
  "gemini-3.1-flash-lite": { input: 250_000, output: 1_500_000, cached: 25_000 },
  "gemini-3-flash-preview": { input: 500_000, output: 3_000_000, cached: 50_000 },
};

/**
 * Whether calls are actually billed. Defaults to free, so `AiUsage.costMicroUsd`
 * stays an honest 0 rather than filling the ledger with amounts nobody is
 * charged — a plausible wrong number reads as real and is worse than a zero.
 */
function isBilled(): boolean {
  return process.env.AI_BILLING_MODE === "paid";
}

/**
 * Cost of one call in micro-USD, rounded to the integer the column stores.
 *
 * `cachedTokens` is a subset of `inputTokens`, so it is priced at the cache
 * rate and removed from the input count rather than added on top. An unpriced
 * model costs 0 instead of throwing: a missing price must never fail a request.
 */
export function estimateCostMicroUsd(model: string, usage: TokenUsage): number {
  if (!isBilled()) return 0;

  const price = PRICES[model];
  if (!price) return 0;

  const billableInput = Math.max(0, usage.inputTokens - usage.cachedTokens);

  const cost =
    (billableInput * price.input +
      usage.cachedTokens * price.cached +
      (usage.outputTokens + usage.thinkingTokens) * price.output) /
    1_000_000;

  return Math.round(cost);
}
