/**
 * Hybrid car search: the words a buyer typed (Postgres full text) and what
 * they meant (pgvector), fused into one ranking.
 *
 * Reciprocal rank fusion: each list contributes 1 / (RRF_K + rank) per car,
 * so a car near the top of either list rises, one near the top of both rises
 * most, and the two scores — ts_rank and cosine — never need to be put on one
 * scale. RRF_K = 60 is the constant from the original paper and the common
 * default; it keeps the first few ranks from dominating.
 *
 * Which cars the meaning list may add is relative, not absolute. Measured on
 * gemini-embedding-2 (lib/ai/evaluation/search.eval.test.ts, 2026-10-12), a
 * query's right and wrong cars overlap in raw similarity (right median 0.524,
 * wrong max 0.573) — no fixed line separates them. Within 0.03 of the query's
 * best match, though, sat 69% of the right cars and 3% of the wrong ones. So
 * the meaning list keeps cars close to the best one for *this* search, above a
 * low floor that stops a query nothing answers from returning the whole lot.
 * Literal matches ("Corolla") come from the full-text list either way.
 */

export const RRF_K = 60;
/** How deep each list goes before fusing: the first pages are what matter. */
export const HYBRID_CANDIDATES = 100;
/** A car joins the meaning list if it is at most this far below the best match. */
export const SEMANTIC_WITHIN_BEST = 0.03;
/** …and above this at all: below it, not even the best match is a match. */
export const SEMANTIC_MIN_SIMILARITY = 0.45;
