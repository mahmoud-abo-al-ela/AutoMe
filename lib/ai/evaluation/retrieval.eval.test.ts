import { describe, it, expect, beforeAll, vi, type TestContext } from "vitest";

// Vitest does not read .env; see car-listing.eval.test.ts.
vi.hoisted(() => {
  if (process.env.AI_EVAL && !process.env.GEMINI_API_KEY) {
    require("dotenv").config();
  }
});

import { embedTexts } from "@/lib/ai/embeddings";
import { AI_FEATURES } from "@/lib/ai/features";
import { CALL_TIMEOUT, EVAL_CALLER, isCapacityFailure } from "@/lib/ai/evaluation/harness";
import { FOLD_SIMILARITY, SUGGEST_SIMILARITY } from "@/lib/services/buyer-question/meaning";

const enabled = Boolean(process.env.AI_EVAL) && Boolean(process.env.GEMINI_API_KEY);

/** Questions buyers ask, by what they mean: English, MSA, and Egyptian Arabic. */
const INTENTS: Record<string, string[]> = {
  accident: [
    "Has this car been in an accident?",
    "Any accidents on this one?",
    "هل تعرضت السيارة لأي حادث؟",
    "العربية دي عملت حادثة قبل كده؟",
  ],
  installments: [
    "Can I pay in installments?",
    "Do you offer financing?",
    "هل يوجد تقسيط؟",
    "ممكن أقسطها؟",
  ],
  serviceHistory: [
    "Does it have a full service history?",
    "Was it serviced at the dealer?",
    "هل للسيارة سجل صيانة كامل؟",
    "العربية متصانة في التوكيل؟",
  ],
  paint: [
    "Is the paint original?",
    "Has any panel been repainted?",
    "هل الدهان أصلي؟",
    "العربية فابريكا ولا فيها رش؟",
  ],
  tradeIn: [
    "Do you accept trade-ins?",
    "Can I swap my old car for this one?",
    "هل تقبلون استبدال سيارتي القديمة؟",
    "ممكن أبدل عربيتي بيها؟",
  ],
  negotiable: [
    "Is the price negotiable?",
    "Is there any discount on the price?",
    "هل السعر قابل للتفاوض؟",
    "فيه فصال في السعر؟",
  ],
  visit: [
    "When can I come to see the car?",
    "What are your opening hours?",
    "متى يمكنني معاينة السيارة؟",
    "المعرض بيفتح امتى؟",
  ],
  warranty: [
    "Does it come with a warranty?",
    "Is there any guarantee on the car?",
    "هل السيارة عليها ضمان؟",
    "العربية عليها ضمان ولا لأ؟",
  ],
};

const texts = Object.values(INTENTS).flat();
const intentOf = Object.entries(INTENTS).flatMap(([intent, list]) => list.map(() => intent));

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / Math.sqrt(na * nb);
}

describe.skipIf(!enabled)("buyer questions by meaning (real embedding model)", () => {
  let vectors: number[][] | "unavailable" | null = null;

  beforeAll(async () => {
    try {
      vectors = (await embedTexts({ feature: AI_FEATURES.questionEmbedding, texts, task: "similarity", ctx: EVAL_CALLER })).vectors;
    } catch (error) {
      if (!isCapacityFailure(error)) throw error;
      vectors = "unavailable";
    }
  }, CALL_TIMEOUT);

  function all(t: TestContext): number[][] {
    if (!vectors || vectors === "unavailable") t.skip("every model in the chain was unavailable");
    return vectors as number[][];
  }

  /** Every pair once, with whether it is the same question. */
  function pairs(v: number[][]) {
    const out: { same: boolean; similarity: number; a: string; b: string }[] = [];
    for (let i = 0; i < v.length; i++) {
      for (let j = i + 1; j < v.length; j++) {
        out.push({ same: intentOf[i] === intentOf[j], similarity: cosine(v[i], v[j]), a: texts[i], b: texts[j] });
      }
    }
    return out;
  }

  it("never folds two different questions together", (t) => {
    const crossed = pairs(all(t)).filter((p) => !p.same && p.similarity >= FOLD_SIMILARITY);
    expect(crossed.map((p) => `${p.similarity.toFixed(3)} ${p.a} ≈ ${p.b}`)).toEqual([]);
  });

  it("finds a rephrasing's own kind first — in other words or the other language", (t) => {
    const v = all(t);
    const misses = v.flatMap((vector, i) => {
      let best = -1;
      let bestScore = -Infinity;
      for (let j = 0; j < v.length; j++) {
        if (j === i) continue;
        const score = cosine(vector, v[j]);
        if (score > bestScore) [best, bestScore] = [j, score];
      }
      return intentOf[best] === intentOf[i] ? [] : [`${texts[i]} → ${texts[best]} (${bestScore.toFixed(3)})`];
    });
    // Recall@1 of at least 90%; the misses are listed when it falls short.
    expect(misses.length / v.length, misses.join("\n")).toBeLessThanOrEqual(0.1);
  });

  it("rarely suggests an answer to a different question", (t) => {
    const all_ = pairs(all(t));
    const wrong = all_.filter((p) => !p.same && p.similarity >= SUGGEST_SIMILARITY);
    const right = all_.filter((p) => p.same && p.similarity >= SUGGEST_SIMILARITY);
    const sameCount = all_.filter((p) => p.same).length;
    const quantile = (values: number[], q: number) => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))].toFixed(3);
    };
    const same = all_.filter((p) => p.same).map((p) => p.similarity);
    const different = all_.filter((p) => !p.same).map((p) => p.similarity);
    // The numbers to tune the thresholds by, in every run's log.
    console.info(
      `[retrieval] suggest ≥ ${SUGGEST_SIMILARITY}: ${right.length}/${sameCount} same-question pairs, ` +
        `${wrong.length}/${all_.length - sameCount} different-question pairs\n` +
        `[retrieval] same question: min ${quantile(same, 0)} · p25 ${quantile(same, 0.25)} · median ${quantile(same, 0.5)}\n` +
        `[retrieval] different: median ${quantile(different, 0.5)} · p98 ${quantile(different, 0.98)} · max ${quantile(different, 1)}`
    );
    // A wrong suggestion costs a dealer a glance, not a deleted question — but
    // it must stay rare to be worth showing.
    expect(wrong.length / (all_.length - sameCount), wrong.map((p) => `${p.similarity.toFixed(3)} ${p.a} ≈ ${p.b}`).join("\n")).toBeLessThanOrEqual(0.02);
  });
});
