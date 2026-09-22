import { describe, it, expect, afterEach } from "vitest";
import { modelsFor, modelFor, estimateCostMicroUsd } from "@/lib/ai/models";

const ENV_KEYS = [
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
    expect(modelsFor("vision")[0]).not.toBe(modelsFor("visionFast")[0]);
  });

  it("offers a fallback behind every task", () => {
    expect(modelsFor("vision").length).toBeGreaterThan(1);
    expect(modelsFor("visionFast").length).toBeGreaterThan(1);
  });

  it("puts an env override in front without discarding the fallbacks", () => {
    process.env.GEMINI_MODEL_VISION = "gemini-3.8-flash";

    const chain = modelsFor("vision");

    expect(chain[0]).toBe("gemini-3.8-flash");
    // Pinning a model should not also remove the safety net that keeps the
    // feature working when the pin turns out to be wrong for this key.
    expect(chain.length).toBeGreaterThan(1);
    expect(modelFor("vision")).toBe("gemini-3.8-flash");
  });

  it("does not list an overridden model twice", () => {
    const [first] = modelsFor("vision");
    process.env.GEMINI_MODEL_VISION = first;

    const chain = modelsFor("vision");

    expect(new Set(chain).size).toBe(chain.length);
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

  it("charges nothing for a model it has no price for", () => {
    process.env.AI_BILLING_MODE = "paid";

    // A missing price must never fail or inflate a request.
    expect(estimateCostMicroUsd("gemini-99-imaginary", usage)).toBe(0);
  });
});
