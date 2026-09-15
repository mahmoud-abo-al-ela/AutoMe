import {
  expandSearchTerm,
  expandSearchTermForText,
} from "@/lib/utils/search-aliases";

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

/**
 * Canonical values — a governorate code and a city slug — matched by equality.
 *
 * Substring matching these would be wrong as well as slow: Cairo's governorate
 * code is "C", and `contains "C"` matches nearly every row in the table.
 */
const EXACT_FIELDS = ["city", "region"];

type Clause = Record<string, unknown>;

const tokenize = (value: string): string[] =>
  value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

const matchesToken = (token: string): Clause => {
  const or: Clause[] = [];

  for (const variant of expandSearchTermForText(token)) {
    for (const field of TEXT_FIELDS) {
      or.push({ [field]: { contains: variant, mode: "insensitive" } });
    }
  }

  for (const variant of expandSearchTerm(token)) {
    for (const field of EXACT_FIELDS) {
      or.push({ [field]: { equals: variant, mode: "insensitive" } });
    }
  }

  return { OR: or };
};

export function buildSearchClause(search?: string | null): Clause | null {
  const trimmed = search?.trim();
  if (!trimmed) return null;

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return null;

  const wordsMatch: Clause = { AND: tokens.map(matchesToken) };

  // A multi-word place resolves to one stored value that no single word
  // matches, so the whole phrase is tried against the canonical columns too.
  //
  // Only against those columns, and only by equality. Feeding a canonical
  // value back through the text matchers is what made searching "القاهرة"
  // return every dealership with a "c" in its description: Cairo's governorate
  // code is "C", and it came back as a phrase to substring-match on.
  const [, ...phraseCanonicals] = expandSearchTerm(trimmed);
  if (phraseCanonicals.length === 0) return wordsMatch;

  const phraseMatch: Clause = {
    OR: phraseCanonicals.flatMap((variant) =>
      EXACT_FIELDS.map((field) => ({
        [field]: { equals: variant, mode: "insensitive" },
      }))
    ),
  };

  return { OR: [wordsMatch, phraseMatch] };
}
