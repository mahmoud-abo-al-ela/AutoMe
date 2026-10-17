import { isProviderId, type ProviderId } from "@/lib/ai/providers";

export type ModelTask = "vision" | "visionFast" | "text" | "textFast" | "judge";

/** One link in a chain: which API, and which of its models. */
export interface ChainEntry {
  provider: ProviderId;
  model: string;
}

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
  textFast: [
    "google/gemini-3.5-flash-lite",
    "google/gemini-3.6-flash",
    "codecraft/gpt-5.5",
    "codecraft/gemini-3.6-flash",
    "codecraft/gemini-3.7-flash",
    ...GEMMA_FALLBACK,
  ],
  text: [
    "codecraft/gpt-5.5",
    "codecraft/gemini-3.6-flash",
    "codecraft/gemini-3.7-flash",
    "google/gemini-3.6-flash",
    "google/gemini-3.5-flash-lite",
    "google/gemini-3.7-flash",
    ...GEMMA_FALLBACK,
  ],
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

const PRICES: Record<string, ModelPrice> = {
  "gemini-3.8-flash": { input: 750_000, output: 3_750_000, cached: 75_000 },
  "gemini-3.7-flash": { input: 750_000, output: 3_750_000, cached: 75_000 },
  "gemini-3.6-flash": { input: 750_000, output: 3_750_000, cached: 75_000 },
  "gemini-3.5-flash": { input: 1_500_000, output: 9_000_000, cached: 150_000 },
  "gemini-3.5-flash-lite": { input: 300_000, output: 2_500_000, cached: 30_000 },
  "gemini-3.1-flash-lite": { input: 250_000, output: 1_500_000, cached: 25_000 },
  "gemini-3-flash-preview": { input: 500_000, output: 3_000_000, cached: 50_000 },
};

function isBilled(): boolean {
  return process.env.AI_BILLING_MODE === "paid";
}

export function estimateCostMicroUsd(
  model: string,
  usage: TokenUsage,
  provider: ProviderId = "google"
): number {
  // Only Google is billed. CodeCraft's plan is sold in tokens, not dollars —
  // the ledger's token counts are what its monthly cap reads.
  if (!isBilled() || provider !== "google") return 0;
  return listPriceMicroUsd(provider, model, usage) ?? 0;
}

function priceOf(price: ModelPrice, usage: TokenUsage): number {
  const billableInput = Math.max(0, usage.inputTokens - usage.cachedTokens);
  const cost =
    (billableInput * price.input +
      usage.cachedTokens * price.cached +
      (usage.outputTokens + usage.thinkingTokens) * price.output) /
    1_000_000;
  return Math.round(cost);
}

export function listPriceMicroUsd(provider: ProviderId, model: string, usage: TokenUsage): number | null {
  if (provider === "google") {
    const price = PRICES[model];
    return price ? priceOf(price, usage) : null;
  }
  const perMillion = Number.parseFloat(process.env.AI_CODECRAFT_USD_PER_MTOK ?? "");
  if (!Number.isFinite(perMillion) || perMillion < 0) return null;
  const microUsd = perMillion * 1_000_000;
  return priceOf({ input: microUsd, output: microUsd, cached: microUsd }, usage);
}
