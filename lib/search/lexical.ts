/**
 * Which of the buyer's words a search should require, which it should only
 * rank by, and which it should set aside — decided by the cars in the search's
 * own scope, never by a list of words.
 *
 * "عربية سيدان" found nothing because every word was required and no listing
 * says "عربية". A stop-word list would fix that one word and miss the next
 * ("لو سمحت", "please", "حلوة"). What a search engine does instead — and what
 * this does — is ask the data:
 *
 * - A word **no car in scope has** is *missing*: it cannot narrow anything, so
 *   it is set aside (and the buyer told), while the search's meaning, which
 *   reads the whole sentence, still has it.
 * - A word found **only in prose** — titles and descriptions — sits beside a
 *   word that names something structured (a make, a body type, a feature tag)
 *   as a ranking signal, not a filter. Otherwise the fix would last only until
 *   one description says "عربية فبريكا", and the word would hide every other
 *   sedan again; "car" in "great first car" is the same problem today.
 * - A word **most cars have** (BM25's low-IDF word) ranks rather than filters
 *   while a rarer word is there to do the narrowing.
 *
 * Something always filters when any word was found, so dropping words never
 * widens a search to "every car": when only prose words remain they filter, and
 * when only common words remain, they do.
 */

/** A word in more than this share of the cars in scope is common… */
export const COMMON_RATIO = 0.6;
/** …but only once there are enough cars for the share to mean anything. */
export const COMMON_MIN_SCOPE = 20;

export interface TermCount {
  /** Cars in scope the term matches anywhere. */
  df: number;
  /** Cars in scope the term matches in a structured field (or by place/year). */
  dfStructured: number;
}

export type TermRole = "filter" | "rank" | "missing";

export interface TermRoles {
  roles: TermRole[];
  /** Every filtering term is a common word kept only because nothing rarer was left. */
  onlyCommon: boolean;
}

export function isCommon(n: number, df: number): boolean {
  return n >= COMMON_MIN_SCOPE && df / n > COMMON_RATIO;
}

export function classifyTerms(n: number, counts: TermCount[]): TermRoles {
  const kind = counts.map(({ df, dfStructured }) => {
    if (df === 0) return "missing" as const;
    if (isCommon(n, df)) return "common" as const;
    return dfStructured > 0 ? ("structured" as const) : ("prose" as const);
  });

  const filtering = kind.includes("structured") ? "structured" : kind.includes("prose") ? "prose" : "common";
  const roles = kind.map((k): TermRole => (k === "missing" ? "missing" : k === filtering ? "filter" : "rank"));
  return { roles, onlyCommon: filtering === "common" && roles.includes("filter") };
}

/**
 * A term's weight in "some of the words" ranking: rarer words count for more,
 * so a car with the rare word outranks one with only the common word.
 */
export function inverseDocumentFrequency(n: number, df: number): number {
  return Math.log(1 + n / Math.max(df, 1));
}
