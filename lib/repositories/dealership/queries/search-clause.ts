import { expandSearchTerm } from "@/lib/locations";

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
 * Each word is also expanded to the value the column actually holds, so a
 * reader who sees "القاهرة" on the page can type it back and find Cairo. Both
 * the whole phrase and the individual words are expanded: "المحلة الكبرى" is a
 * two-word name for one stored value, while "معرض القاهرة" is a free word next
 * to a place name.
 */

/** Free text, matched by substring. */
const TEXT_FIELDS = ["name", "description", "address"];

/** Canonical values — a governorate code and a city slug — matched by equality. */
const EXACT_FIELDS = ["city", "region"];

type Clause = Record<string, unknown>;

const tokenize = (value: string): string[] =>
  value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

const equalsAny = (variants: string[]): Clause[] =>
  variants.flatMap((variant) =>
    EXACT_FIELDS.map((field) => ({
      [field]: { equals: variant, mode: "insensitive" },
    }))
  );

const matchesToken = (token: string): Clause => {
  const { exact, text } = expandSearchTerm(token);

  return {
    OR: [
      ...text.flatMap((variant) =>
        TEXT_FIELDS.map((field) => ({
          [field]: { contains: variant, mode: "insensitive" },
        }))
      ),
      ...equalsAny(exact),
    ],
  };
};

export function buildSearchClause(search?: string | null): Clause | null {
  const trimmed = search?.trim();
  if (!trimmed) return null;

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return null;

  const wordsMatch: Clause = { AND: tokens.map(matchesToken) };

  // A multi-word place resolves to one stored value that no single word
  // matches, so the whole phrase is tried against the canonical columns too.
  const { exact } = expandSearchTerm(trimmed);
  if (exact.length === 0) return wordsMatch;

  return { OR: [wordsMatch, { OR: equalsAny(exact) }] };
}
