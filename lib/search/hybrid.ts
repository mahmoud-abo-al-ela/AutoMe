export const RRF_K = 60;
/** How deep each list goes before fusing: the first pages are what matter. */
export const HYBRID_CANDIDATES = 100;
/** A car joins the meaning list if it is at most this far below the best match. */
export const SEMANTIC_WITHIN_BEST = 0.03;
/** …and above this at all: below it, not even the best match is a match. */
export const SEMANTIC_MIN_SIMILARITY = 0.45;
