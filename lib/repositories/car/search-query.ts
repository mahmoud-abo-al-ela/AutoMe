import { expandSearchTermForText } from "@/lib/locations";
import { searchWords } from "@/lib/utils/search-text";

/**
 * Builds the Postgres prefix tsquery for the car search box.
 *
 * Lifted out of search.js so it can be tested directly: it produces a string
 * that is injected into `to_tsquery`, where a malformed grouping is a runtime
 * SQL error rather than a wrong result.
 *
 * Three jobs:
 *
 * - **Prefix matching**, so as-you-type queries hit partial words:
 *   "toyota cor" → `toyota:* & cor:*`.
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

export function toPrefixTsquery(term: string): string {
  const trimmed = term?.trim();
  if (!trimmed) return "";

  // A multi-word place name is one alias, so the whole phrase is tried first.
  const phraseVariants = expandSearchTermForText(trimmed);
  if (phraseVariants.length > 1) {
    const group = orGroup(phraseVariants);
    if (group) return group;
  }

  // Otherwise each word is expanded on its own, so a free word can sit beside
  // an alias ("نيسان 2020").
  const groups = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => orGroup(expandSearchTermForText(token)))
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

  const [, firstAlias] = expandSearchTermForText(trimmed);
  return firstAlias ?? trimmed;
}
