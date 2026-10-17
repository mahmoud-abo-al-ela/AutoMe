import { expandSearchTerm } from "@/lib/locations";

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
