import { expandSearchTerm } from "@/lib/utils/search-aliases";

/**
 * Builds the Postgres prefix tsquery for the car search box.
 *
 * Lifted out of search.js so it can be tested directly: it produces a string
 * that is injected into `to_tsquery`, where a malformed grouping is a runtime
 * SQL error rather than a wrong result.
 *
 * Two jobs:
 *
 * - **Prefix matching**, so as-you-type queries hit partial words:
 *   "toyota cor" → `toyota:* & cor:*`.
 * - **Alias expansion**, so an Arabic query reaches English columns. The old
 *   version reduced the term with `/[a-z0-9]+/`, which discards Arabic
 *   entirely — "نيسان" produced an empty query and therefore no results, while
 *   the filter chip beside the search box said "نيسان".
 *
 * Reducing to alphanumerics is also what keeps the string safe to inject: no
 * quote, backslash or tsquery operator can survive it.
 */

/**
 * The alphanumeric words of a term, lowercased.
 *
 * Latin diacritics are folded first. Place names reach the database carrying
 * them — "Al Maḩallah al Kubrá" is in live data — and without folding, the
 * reduction splits the word at the mark and searches for "ma" and "allah"
 * separately.
 */
function words(value: string): string[] {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? []
  );
}

/** `a:* & b:*` for one variant — all of its words must be present. */
function variantClause(variant: string): string | null {
  const parts = [...new Set(words(variant))];
  if (parts.length === 0) return null;
  return parts.map((word) => `${word}:*`).join(" & ");
}

/**
 * One OR group for a term and everything it is the display form of:
 * `(nissan:* | ...)`. Returns null when nothing survives reduction, which is
 * what happens to an Arabic word with no alias.
 */
function orGroup(variants: string[]): string | null {
  const clauses = [...new Set(variants.map(variantClause).filter(Boolean))] as string[];

  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0];

  return `(${clauses.join(" | ")})`;
}

export function toPrefixTsquery(term: string): string {
  const trimmed = term?.trim();
  if (!trimmed) return "";

  // A multi-word place name is one alias, so the whole phrase is tried first.
  const phraseVariants = expandSearchTerm(trimmed);
  if (phraseVariants.length > 1) {
    const group = orGroup(phraseVariants);
    if (group) return group;
  }

  // Otherwise each word is expanded on its own, so a free word can sit beside
  // an alias ("نيسان 2020").
  const groups = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => orGroup(expandSearchTerm(token)))
    .filter(Boolean);

  return groups.join(" & ");
}

/**
 * The term to use for the trigram fallback, which compares against the English
 * make/model columns and so cannot work on Arabic input. Falls back to the
 * original, which simply matches nothing — the same as before.
 */
export function toTrigramTerm(term: string): string {
  const trimmed = term?.trim();
  if (!trimmed) return "";

  const [, firstAlias] = expandSearchTerm(trimmed);
  return firstAlias ?? trimmed;
}
