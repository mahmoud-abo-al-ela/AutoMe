import { expandSearchTerm, hasAlias } from "@/lib/locations";
import { searchWords } from "@/lib/utils/search-text";
import { isCorrectable } from "@/lib/search/lexical";

/**
 * Builds the Postgres prefix tsqueries for the car search box — one per term,
 * which search.js judges and combines.
 *
 * Lifted out of search.js so it can be tested directly: it produces strings
 * that are injected into `to_tsquery`, where a malformed grouping is a runtime
 * SQL error rather than a wrong result.
 *
 * Three jobs:
 *
 * - **Prefix matching**, so as-you-type queries hit partial words:
 *   "toyota cor" → `toyota:*`, `cor:*`.
 * - **Alias expansion**, so an Arabic query reaches the English columns a
 *   reader sees translated. "نيسان" has to find the Nissans, because that is
 *   what the filter chip beside the search box says.
 * - **Arabic normalization**, so a query reaches Arabic text a dealer wrote.
 *   Words are folded by `searchWords`, the same fold the stored vector is
 *   built through — see lib/utils/search-text.ts, and the warning there about
 *   folding one side only.
 *
 * Reducing to letters and digits is also what keeps the string safe to inject:
 * no quote, backslash or tsquery operator can survive it.
 */

/** `a:* & b:*` for one variant — all of its words must be present. */
function variantClause(variant: string): string | null {
  const parts = [...new Set(searchWords(variant))];
  if (parts.length === 0) return null;
  return parts.map((word) => `${word}:*`).join(" & ");
}

/**
 * One OR group for a term and everything it is the display form of:
 * `(nissan:* | نيسان:* | ...)`. Returns null only when nothing survives
 * reduction — punctuation on its own, now that Arabic is kept.
 */
function orGroup(variants: string[]): string | null {
  const clauses = [...new Set(variants.map(variantClause).filter(Boolean))] as string[];

  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0];

  return `(${clauses.join(" | ")})`;
}

/**
 * One thing the buyer typed — a word, or a multi-word place that is one alias —
 * with every way it can match a car. Judged on its own by the search (does any
 * car have it? only in prose? in most cars?), so a word no listing uses cannot
 * empty a search the other words would answer.
 */
export interface SearchTerm {
  /** As the buyer typed it, for telling them which words were set aside. */
  text: string;
  /** Prefix tsquery over every field: `(nissan:* | نيسان:*)`. */
  query: string;
  /**
   * The same, restricted to the structured fields — make and model (weight A),
   * body, fuel, gearbox, colour, location and feature tags (D) — and never the
   * free text of titles and descriptions (B, C).
   */
  structuredQuery: string;
  /** Canonical dealership city/region values the term names, compared by equality. */
  places: string[];
  /** A model year ("2020", "٢٠٢٠"), which the search vector does not hold. */
  year: number | null;
}

/** Most terms a search is judged on; any further words reach only its meaning. */
export const MAX_SEARCH_TERMS = 8;

const YEAR = /^(19|20)\d{2}$/;

function toTerm(text: string, variants: string[], places: string[]): SearchTerm | null {
  const query = orGroup(variants);
  if (!query) return null;
  const words = searchWords(text);
  return {
    text,
    query,
    // Every lexeme is `word:*`; weights are added after the prefix marker.
    structuredQuery: query.replace(/:\*/g, ":*AD"),
    places,
    year: words.length === 1 && YEAR.test(words[0]) ? Number(words[0]) : null,
  };
}

/**
 * The terms of a search, deduplicated: "تويوتا toyota" is one term, not two.
 */
export function searchTerms(term: string): SearchTerm[] {
  const trimmed = term?.trim();
  if (!trimmed) return [];

  const tokens = trimmed.split(/\s+/);

  // A multi-word place name is one alias, so the whole phrase is tried first.
  if (tokens.length > 1) {
    const phrase = expandSearchTerm(trimmed);
    const isAlias = phrase.text.length > 1 || phrase.exact.length > 0;
    const whole = isAlias ? toTerm(trimmed, phrase.text, phrase.exact) : null;
    if (whole) return [whole];
  }

  // Otherwise each word is expanded on its own, so a free word can sit beside
  // an alias ("نيسان 2020").
  const terms: SearchTerm[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const { text, exact } = expandSearchTerm(token);
    const found = toTerm(token, text, exact);
    if (!found || seen.has(found.query)) continue;
    seen.add(found.query);
    terms.push(found);
    if (terms.length === MAX_SEARCH_TERMS) break;
  }
  return terms;
}

/**
 * The folded word a typo correction may replace this term with, or null. Only
 * a single free word qualifies: never a place, a year, or an alias or known
 * value (a make in Arabic, a body type) — those are known words already, and
 * one no car in scope has is genuinely absent, not misspelt. isCorrectable
 * rules out short words and model codes.
 */
export function correctableWord(term: SearchTerm): string | null {
  if (term.places.length > 0 || term.year !== null || hasAlias(term.text)) return null;
  const words = searchWords(term.text);
  return words.length === 1 && isCorrectable(words[0]) ? words[0] : null;
}

/**
 * The term that stands in for a typo: any of the known words that may have
 * been meant, matched like every term, by prefix. Keeps the typed text, so
 * the search can say what it corrected.
 */
export function correctedTerm(typed: string, words: string[]): SearchTerm | null {
  return toTerm(typed, words, []);
}
