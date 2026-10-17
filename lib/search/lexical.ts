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

/** Shortest word, in letters, a correction is tried on: short words have too many neighbours. */
export const CORRECTION_MIN_LENGTH = 4;
/** How alike (pg_trgm similarity) a known word must be to stand in for a typo. */
export const CORRECTION_SIMILARITY = 0.4;
/** Candidates this close to the best are all kept: the search cannot tell which was meant. */
export const CORRECTION_MARGIN = 0.05;
/** At most this many known words stand in for one typo. */
export const MAX_CORRECTIONS = 3;

type Script = "arabic" | "latin";

const ARABIC_WORD = /^\p{Script=Arabic}+$/u;
const LATIN_WORD = /^\p{Script=Latin}+$/u;

/** A word wholly in one script's letters; null for digits, a mix, or anything else. */
function scriptOf(word: string): Script | null {
  if (ARABIC_WORD.test(word)) return "arabic";
  if (LATIN_WORD.test(word)) return "latin";
  return null;
}

export function isCorrectable(word: string): boolean {
  return [...word].length >= CORRECTION_MIN_LENGTH && scriptOf(word) !== null;
}

export interface CorrectionCandidate {
  word: string;
  similarity: number;
  /** Public cars with the word, as the vocabulary last counted. */
  ndoc: number;
  /** Cars in the search's scope with the word. */
  df: number;
}

export function chooseCorrection(token: string, candidates: CorrectionCandidate[]): string[] {
  const script = scriptOf(token);
  const usable = candidates
    .filter((c) => c.df > 0 && c.similarity >= CORRECTION_SIMILARITY && scriptOf(c.word) === script)
    .sort((a, b) => b.similarity - a.similarity || b.ndoc - a.ndoc || a.word.localeCompare(b.word));
  if (usable.length === 0) return [];
  const best = usable[0].similarity;
  return usable
    .filter((c) => c.similarity >= best - CORRECTION_MARGIN)
    .slice(0, MAX_CORRECTIONS)
    .map((c) => c.word);
}
