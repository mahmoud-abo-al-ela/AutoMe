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
import { carEmbeddingText } from "@/lib/services/car/embedding-text";
import { CARS, QUERIES } from "@/lib/ai/evaluation/search-fixtures";
import { SEMANTIC_MIN_SIMILARITY, SEMANTIC_WITHIN_BEST } from "@/lib/search/hybrid";

/**
 * Meaning-based car search, against the real embedding model.
 *
 *   AI_EVAL=1 pnpm eval lib/ai/evaluation/search
 *
 * A small catalogue of the listings Egyptian dealers write, and what buyers
 * type looking for them — in English, Modern Standard Arabic and Egyptian
 * Arabic, often in words the listing never uses. Two requests: the cars as
 * documents, the queries as queries. Sets SEMANTIC_MIN_SIMILARITY in
 * lib/search/hybrid.ts: every run logs the distribution to set it by.
 */

const enabled = Boolean(process.env.AI_EVAL) && Boolean(process.env.GEMINI_API_KEY);

const carIds = Object.keys(CARS) as (keyof typeof CARS)[];

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

describe.skipIf(!enabled)("car search by meaning (real embedding model)", () => {
  let scored: { query: string; relevant: string[]; ranked: { id: string; similarity: number }[] }[] | "unavailable" | null = null;

  beforeAll(async () => {
    try {
      const cars = await embedTexts({
        feature: AI_FEATURES.carEmbedding,
        texts: carIds.map((id) => carEmbeddingText(CARS[id])),
        task: "document",
        ctx: EVAL_CALLER,
      });
      const queries = await embedTexts({
        feature: AI_FEATURES.carEmbedding,
        texts: QUERIES.map((q) => q.query),
        task: "query",
        ctx: EVAL_CALLER,
      });
      scored = QUERIES.map((q, i) => ({
        query: q.query,
        relevant: q.relevant,
        ranked: carIds
          .map((id, j) => ({ id, similarity: cosine(queries.vectors[i], cars.vectors[j]) }))
          .sort((a, b) => b.similarity - a.similarity),
      }));
    } catch (error) {
      if (!isCapacityFailure(error)) throw error;
      scored = "unavailable";
    }
  }, CALL_TIMEOUT);

  function all(t: TestContext) {
    if (!scored || scored === "unavailable") t.skip("every model in the chain was unavailable");
    return scored as Exclude<typeof scored, "unavailable" | null>;
  }

  it("puts a car that answers the query first, for nearly every query", (t) => {
    const misses = all(t).filter((s) => !s.relevant.includes(s.ranked[0].id));
    expect(misses.length / QUERIES.length, misses.map((s) => `${s.query} → ${s.ranked[0].id}`).join("\n")).toBeLessThanOrEqual(0.1);
  });

  it("keeps most right cars near the best match, and few wrong ones — what the meaning list adds", (t) => {
    const s = all(t);
    const kept = (q: (typeof s)[number], r: { similarity: number }) =>
      r.similarity >= SEMANTIC_MIN_SIMILARITY && q.ranked[0].similarity - r.similarity <= SEMANTIC_WITHIN_BEST;
    const right = s.flatMap((q) => q.ranked.filter((r) => q.relevant.includes(r.id)).map((r) => kept(q, r)));
    const wrong = s.flatMap((q) => q.ranked.filter((r) => !q.relevant.includes(r.id)).map((r) => kept(q, r)));
    const share = (values: boolean[]) => values.filter(Boolean).length / values.length;
    const best = s.map((q) => q.ranked[0].similarity).sort((a, b) => a - b);
    console.info(
      `[search] within ${SEMANTIC_WITHIN_BEST} of the best, above ${SEMANTIC_MIN_SIMILARITY}: ` +
        `${(share(right) * 100).toFixed(0)}% of right cars, ${(share(wrong) * 100).toFixed(0)}% of wrong cars\n` +
        `[search] best match per query: min ${best[0].toFixed(3)} · max ${best[best.length - 1].toFixed(3)}`
    );
    expect(share(right)).toBeGreaterThanOrEqual(0.6);
    expect(share(wrong)).toBeLessThanOrEqual(0.06);
  });
});
