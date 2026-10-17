import { expandSearchTerm, hasAlias, knownNames } from "@/lib/locations";
import { searchWords } from "@/lib/utils/search-text";
import { isCorrectable } from "@/lib/search/lexical";

/** `a:* & b:*` for one variant — all of its words must be present. */
function variantClause(variant: string): string | null {
  const parts = [...new Set(searchWords(variant))];
  if (parts.length === 0) return null;
  return parts.map((word) => `${word}:*`).join(" & ");
}

function orGroup(variants: string[]): string | null {
  const clauses = [...new Set(variants.map(variantClause).filter(Boolean))] as string[];

  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0];

  return `(${clauses.join(" | ")})`;
}

export interface SearchTerm {
  /** As the buyer typed it, for telling them which words were set aside. */
  text: string;
  /** Prefix tsquery over every field: `(nissan:* | نيسان:*)`. */
  query: string;
  structuredQuery: string;
  nameQuery: string;
  ownQuery: string;
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
    nameQuery: query.replace(/:\*/g, ":A"),
    ownQuery: query.replace(/:\*/g, ":*AB"),
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

export function correctableWord(term: SearchTerm): string | null {
  if (term.places.length > 0 || term.year !== null || hasAlias(term.text)) return null;
  const words = searchWords(term.text);
  return words.length === 1 && isCorrectable(words[0]) ? words[0] : null;
}

let names: Map<string, string> | undefined;

export function correctionNames(): Map<string, string> {
  if (!names) {
    names = new Map();
    for (const surface of knownNames()) {
      const words = searchWords(surface);
      if (words.length === 1 && isCorrectable(words[0]) && !names.has(words[0])) names.set(words[0], surface);
    }
  }
  return names;
}

export function correctedTerm(typed: string, words: string[]): SearchTerm | null {
  const expanded = words.map((word) => expandSearchTerm(word));
  const unique = (values: string[]) => [...new Set(values)];
  return toTerm(
    typed,
    unique(expanded.flatMap((variants) => variants.text)),
    unique(expanded.flatMap((variants) => variants.exact))
  );
}
