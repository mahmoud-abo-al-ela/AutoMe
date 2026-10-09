import { describe, it, expect, afterEach } from "vitest";
import { modelsFor, modelFor, estimateCostMicroUsd, listPriceMicroUsd, parseChainEntry } from "@/lib/ai/models";

const ENV_KEYS = [
  "AI_MODELS_VISION",
  "GEMINI_MODEL_VISION",
  "GEMINI_MODEL_VISION_FAST",
  "AI_BILLING_MODE",
] as const;

const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

const usage = {
  inputTokens: 1_000_000,
  outputTokens: 1_000_000,
  thinkingTokens: 0,
  cachedTokens: 0,
};

describe("modelsFor", () => {
  it("gives each task its own chain", () => {
    // The public hero search must not share the dealer extraction's model: a
    // burst of photo searches would otherwise crowd out inventory uploads.
    expect(modelsFor("vision")[0]).not.toEqual(modelsFor("visionFast")[0]);
  });

  it("leads dealer work with CodeCraft and keeps Google behind it", () => {
    for (const task of ["vision", "text"] as const) {
      const chain = modelsFor(task);
      expect(chain[0].provider).toBe("codecraft");
      expect(chain.some((entry) => entry.provider === "google")).toBe(true);
    }
  });

  it("answers buyers from the fast chain, with CodeCraft behind it", () => {
    const chain = modelsFor("textFast");
    expect(chain[0]).toEqual({ provider: "google", model: "gemini-3.5-flash-lite" });
    expect(chain.some((entry) => entry.provider === "codecraft")).toBe(true);
  });

  it("keeps the high-volume public path off CodeCraft's monthly allowance first", () => {
    expect(modelsFor("visionFast")[0].provider).toBe("google");
    expect(modelsFor("visionFast").some((entry) => entry.provider === "codecraft")).toBe(true);
  });

  it("replaces a whole chain from AI_MODELS_<TASK>, skipping unknown providers", () => {
    process.env.AI_MODELS_VISION = "google/gemini-3.6-flash, nope/x ,codecraft/gpt-5.6-luna";
    expect(modelsFor("vision")).toEqual([
      { provider: "google", model: "gemini-3.6-flash" },
      { provider: "codecraft", model: "gpt-5.6-luna" },
    ]);
  });

  it("puts a legacy Gemini pin first among Google's entries, not ahead of CodeCraft", () => {
    process.env.GEMINI_MODEL_VISION = "gemini-3.8-flash";

    const chain = modelsFor("vision");
    const firstGoogle = chain.find((entry) => entry.provider === "google");

    expect(chain[0].provider).toBe("codecraft");
    expect(firstGoogle).toEqual({ provider: "google", model: "gemini-3.8-flash" });
    expect(modelFor("vision").provider).toBe("codecraft");
  });

  it("reads car photos with Qwen 3.8 Max first, via CodeCraft", () => {
    expect(modelFor("vision")).toEqual({ provider: "codecraft", model: "qwen3.8-max" });
  });

  it("does not list a pinned model twice", () => {
    process.env.GEMINI_MODEL_VISION = "gemini-3.6-flash";
    const labels = modelsFor("vision").map((e) => `${e.provider}/${e.model}`);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("parseChainEntry", () => {
  it("reads provider/model, and a bare id as Google's", () => {
    expect(parseChainEntry("codecraft/gemini-3.7-flash")).toEqual({
      provider: "codecraft",
      model: "gemini-3.7-flash",
    });
    expect(parseChainEntry("gemini-3.6-flash")).toEqual({ provider: "google", model: "gemini-3.6-flash" });
    expect(parseChainEntry("unknown/model")).toBeNull();
  });
});

describe("estimateCostMicroUsd", () => {
  it("is zero on the free tier, whatever the token count", () => {
    delete process.env.AI_BILLING_MODE;

    // A plausible wrong number reads as real; an honest zero does not.
    expect(estimateCostMicroUsd("gemini-3.7-flash", usage)).toBe(0);
  });

  it("prices a billed call from the published rates", () => {
    process.env.AI_BILLING_MODE = "paid";

    // 1M in at $0.75 + 1M out at $3.75 = $4.50 = 4_500_000 micro-USD.
    expect(estimateCostMicroUsd("gemini-3.7-flash", usage)).toBe(4_500_000);
  });

  it("bills thinking tokens at the output rate", () => {
    process.env.AI_BILLING_MODE = "paid";

    const withThinking = estimateCostMicroUsd("gemini-3.7-flash", {
      ...usage,
      outputTokens: 0,
      thinkingTokens: 1_000_000,
    });
    const withOutput = estimateCostMicroUsd("gemini-3.7-flash", {
      ...usage,
      outputTokens: 1_000_000,
      thinkingTokens: 0,
    });

    // Google quotes "Output price (including thinking tokens)", contradicting
    // the AiUsage column comment that calls them separately billed.
    expect(withThinking).toBe(withOutput);
  });

  it("prices cached tokens at the cache rate instead of the input rate", () => {
    process.env.AI_BILLING_MODE = "paid";

    const cached = estimateCostMicroUsd("gemini-3.7-flash", {
      inputTokens: 1_000_000,
      cachedTokens: 1_000_000,
      outputTokens: 0,
      thinkingTokens: 0,
    });

    // cachedContentTokenCount is a subset of promptTokenCount, so it is
    // discounted, not added on top: 1M at $0.075 rather than $0.75.
    expect(cached).toBe(75_000);
  });

  it("charges nothing through a provider sold in tokens rather than dollars", () => {
    process.env.AI_BILLING_MODE = "paid";
    expect(estimateCostMicroUsd("gemini-3.7-flash", usage, "codecraft")).toBe(0);
  });

  it("charges nothing for a model it has no price for", () => {
    process.env.AI_BILLING_MODE = "paid";

    // A missing price must never fail or inflate a request.
    expect(estimateCostMicroUsd("gemini-99-imaginary", usage)).toBe(0);
  });
});

describe("listPriceMicroUsd", () => {
  const usage = { inputTokens: 1_000_000, outputTokens: 100_000, thinkingTokens: 100_000, cachedTokens: 0 };

  it("prices Google tokens at list price whether or not the call was billed", () => {
    delete process.env.AI_BILLING_MODE;
    // 1M input at 300,000 + 200k output+thinking at 2,500,000 per million.
    expect(listPriceMicroUsd("google", "gemini-3.5-flash-lite", usage)).toBe(800_000);
    // The ledger's billed cost stays an honest zero on the free tier.
    expect(estimateCostMicroUsd("gemini-3.5-flash-lite", usage, "google")).toBe(0);
  });

  it("calls a model with no known price unknown, not free", () => {
    expect(listPriceMicroUsd("google", "gemma-4-26b-a4b-it", usage)).toBeNull();
  });

  it("prices CodeCraft at the plan's rate per million tokens, when it is configured", () => {
    delete process.env.AI_CODECRAFT_USD_PER_MTOK;
    expect(listPriceMicroUsd("codecraft", "gpt-5.5", usage)).toBeNull();
    process.env.AI_CODECRAFT_USD_PER_MTOK = "2";
    try {
      // 1.2M tokens at $2 per million.
      expect(listPriceMicroUsd("codecraft", "gpt-5.5", usage)).toBe(2_400_000);
    } finally {
      delete process.env.AI_CODECRAFT_USD_PER_MTOK;
    }
  });
});
