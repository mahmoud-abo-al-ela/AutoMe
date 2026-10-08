/**
 * Model registry and cost table.
 *
 * Call sites ask for a *task*, never a model. Each task resolves to an ordered
 * chain of provider/model pairs, and the client walks it when a model is busy,
 * retired, or its provider is out of allowance — so any one failure degrades
 * to the next entry instead of a failed upload.
 */

import { isProviderId, type ProviderId } from "@/lib/ai/providers";

export type ModelTask = "vision" | "visionFast" | "text" | "textFast" | "judge";

/** One link in a chain: which API, and which of its models. */
export interface ChainEntry {
  provider: ProviderId;
  model: string;
}

/**
 * Chains, best first, written "provider/model".
 *
 * **CodeCraft leads `vision` and `text`** — the dealer-facing work — because
 * Google's free tier mostly refuses: over the 7 days to 2026-09-27 the ledger
 * shows gemini-3.7-flash succeeding 24% of the time and 3.6-flash 45%, nearly
 * all failures 503 "high demand". Its first model is the same Gemini 3.7 Flash
 * the prompts and evaluations were written against, so behaviour carries over;
 * its second is GPT-5.6 Luna, a different vendor behind the gateway, so one
 * upstream outage does not take both.
 *
 * **`visionFast` leads with Google** on purpose. It is the public hero search
 * and the per-photo alt text — the highest-volume, lowest-stakes calls — and
 * an image costs ~4,400 CodeCraft tokens against a 1M monthly allowance. Spent
 * there, the allowance would be gone before a dealer uploads a car. CodeCraft
 * still backs it when Google is busy.
 *
 * Google's own entries are ordered by that same ledger: the models that
 * actually answer first. Gemma 4 closes every chain — separate capacity on the
 * same key, weaker at identifying a car, reached only when all else is busy.
 */
const GEMMA_FALLBACK = ["google/gemma-4-26b-a4b-it", "google/gemma-4-31b-it"];

const DEFAULT_CHAINS: Record<ModelTask, string[]> = {
  vision: [
    // Qwen 3.8 Max first — on trial from 2026-09-29, the owner's choice after
    // Claude Sonnet 5 returned invalid JSON. It reads each car's photos on
    // the add-car form. Then the model the photo evaluation passed on (14/14), and others behind
    // the gateway: a timeout walks on to the next model.
    "codecraft/qwen3.8-max",
    "codecraft/gemini-3.7-flash",
    "codecraft/gpt-5.6-luna",
    "codecraft/gpt-5.5",
    "google/gemini-3.6-flash",
    "google/gemini-3.5-flash-lite",
    "google/gemini-3.7-flash",
    ...GEMMA_FALLBACK,
  ],
  visionFast: [
    "google/gemini-3.5-flash-lite",
    "google/gemini-3.6-flash",
    "codecraft/gemini-3.7-flash",
    ...GEMMA_FALLBACK,
  ],
  /**
   * Buyer-facing text: the listing assistant, with a buyer waiting on the page.
   * Leads with Google for the same reasons as visionFast — public and high
   * volume — and because the wait is the product: measured 2026-09-28 on the
   * grown Q&A prompt, CodeCraft took 7.8-27.7 s and timed out at 30 s on 5 of
   * 13 questions (one failed outright once the budget ran out), while
   * 3.5-flash-lite answered in ~1 s and passes the same evaluation.
   */
  textFast: [
    "google/gemini-3.5-flash-lite",
    "google/gemini-3.6-flash",
    "codecraft/gpt-5.5",
    "codecraft/gemini-3.6-flash",
    "codecraft/gemini-3.7-flash",
    ...GEMMA_FALLBACK,
  ],
  /**
   * Dealer text: translation and the coach. CodeCraft first (user's choice),
   * ordered by a benchmark on 2026-09-28 of eleven CodeCraft models on the
   * buyer-question prompt: gpt-5.5 averaged ~15 s, gemini-3.6-flash ~17 s,
   * gemini-3.7-flash ~27 s; all were correct and wrote Egyptian Arabic.
   * Their replies were near word-for-word identical across vendors, which with
   * the identical token counts suggests one backend behind the names — so
   * the spread is likely queue noise, and more names add retries, not speed.
   */
  text: [
    "codecraft/gpt-5.5",
    "codecraft/gemini-3.6-flash",
    "codecraft/gemini-3.7-flash",
    "google/gemini-3.6-flash",
    "google/gemini-3.5-flash-lite",
    "google/gemini-3.7-flash",
    ...GEMMA_FALLBACK,
  ],
  /**
   * The evaluation judge (lib/ai/evaluation/judge.ts) — never production.
   * Led by a stronger model than the ones that write the graded replies
   * (textFast leads with 3.5-flash-lite, text with gpt-5.5), so no model
   * grades its own work first; Google-led so a nightly run spends free daily
   * requests, not CodeCraft's monthly tokens. No Gemma: a weak judge's verdict
   * is noise, and an unjudged case is only inconclusive.
   *
   * 3.6-flash leads because 3.7-flash answered 503 to every one of seven
   * calibration calls on 2026-10-10; both passed the calibration suite.
   */
  judge: ["google/gemini-3.6-flash", "codecraft/gemini-3.7-flash", "google/gemini-3.7-flash"],
};

/** Replace a task's whole chain without a deploy: comma-separated "provider/model". */
const CHAIN_ENV_KEYS: Record<ModelTask, string> = {
  vision: "AI_MODELS_VISION",
  visionFast: "AI_MODELS_VISION_FAST",
  textFast: "AI_MODELS_TEXT_FAST",
  text: "AI_MODELS_TEXT",
  judge: "AI_MODELS_JUDGE",
};

/**
 * The older single-model pins, from when Google was the only provider. Still
 * honoured, as the first *Google* entry — never ahead of the providers before
 * it, which a pin written for a one-provider world did not know existed.
 */
const LEGACY_GOOGLE_PIN_KEYS: Partial<Record<ModelTask, string>> = {
  vision: "GEMINI_MODEL_VISION",
  visionFast: "GEMINI_MODEL_VISION_FAST",
  text: "GEMINI_MODEL_TEXT",
};

/** "provider/model" to an entry. A bare model id is taken to be Google's. */
export function parseChainEntry(value: string): ChainEntry | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const slash = trimmed.indexOf("/");
  if (slash < 0) return { provider: "google", model: trimmed };
  const provider = trimmed.slice(0, slash);
  const model = trimmed.slice(slash + 1);
  return isProviderId(provider) && model ? { provider, model } : null;
}

const same = (a: ChainEntry, b: ChainEntry) => a.provider === b.provider && a.model === b.model;

/** "provider/model", for logs and cache keys. */
export function entryLabel(entry: ChainEntry): string {
  return `${entry.provider}/${entry.model}`;
}

/**
 * The chain for a task, best first. Providers without a key are NOT removed
 * here — the client does that, so this stays a pure function of config.
 */
export function modelsFor(task: ModelTask): ChainEntry[] {
  const override = process.env[CHAIN_ENV_KEYS[task]];
  const source = override ? override.split(",") : DEFAULT_CHAINS[task];
  const chain = source
    .map(parseChainEntry)
    .filter((entry): entry is ChainEntry => entry !== null);

  const pinKey = LEGACY_GOOGLE_PIN_KEYS[task];
  const pin = pinKey ? process.env[pinKey] : undefined;
  if (!pin) return chain;

  const pinned: ChainEntry = { provider: "google", model: pin };
  const rest = chain.filter((entry) => !same(entry, pinned));
  const firstGoogle = rest.findIndex((entry) => entry.provider === "google");
  const at = firstGoogle < 0 ? rest.length : firstGoogle;
  return [...rest.slice(0, at), pinned, ...rest.slice(at)];
}

/** The entry a task prefers. */
export function modelFor(task: ModelTask): ChainEntry {
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
 * Google's published paid-tier rates, in micro-USD per million tokens.
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
export function estimateCostMicroUsd(
  model: string,
  usage: TokenUsage,
  provider: ProviderId = "google"
): number {
  // Only Google is priced. CodeCraft's plan is sold in tokens, not dollars —
  // the ledger's token counts are what its monthly cap reads.
  if (!isBilled() || provider !== "google") return 0;

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
