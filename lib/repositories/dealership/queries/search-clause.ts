import { expandSearchTerm } from "@/lib/utils/search-aliases";

/**
 * The `where` fragment for a dealership free-text search.
 *
 * Extracted because the same block was written out twice in listing.js, once
 * for the listing query and once for the export query, and the two had to be
 * kept in step by hand.
 *
 * Token-based: every word must appear in at least one field (AND across words,
 * OR across fields), so "cairo gallery" matches "Cairo Auto Gallery", which a
 * single substring `contains` on the whole phrase would miss.
 *
 * Each word is also expanded to the English value it displays as, so a reader
 * who sees "القاهرة" on the page can type it back and find Cairo. Both the
 * whole phrase and the individual words are expanded: "المحلة الكبرى" is a
 * two-word alias for one stored value, while "معرض القاهرة" is a free word
 * next to an alias.
 */
const SEARCH_FIELDS = ["name", "description", "address", "city", "region"];

type Clause = Record<string, unknown>;

const tokenize = (value: string): string[] =>
  value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

const matchesToken = (token: string): Clause => ({
  // One OR arm per (variant, field) pair: the word itself, plus anything it is
  // the display form of.
  OR: expandSearchTerm(token).flatMap((variant) =>
    SEARCH_FIELDS.map((field) => ({
      [field]: { contains: variant, mode: "insensitive" },
    }))
  ),
});

export function buildSearchClause(search?: string | null): Clause | null {
  const trimmed = search?.trim();
  if (!trimmed) return null;

  // Whole-phrase aliases first, so a multi-word place name resolves as a unit.
  const phrases = expandSearchTerm(trimmed);

  const clauses = phrases
    .map((phrase) => tokenize(phrase))
    .filter((tokens) => tokens.length > 0)
    .map((tokens) => ({ AND: tokens.map(matchesToken) }));

  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0];

  return { OR: clauses };
}
