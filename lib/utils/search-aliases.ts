import arCarAttributes from "@/messages/ar/carAttributes.json";
import { placeAliasIndex } from "@/lib/utils/place-names";

/**
 * Lets an Arabic reader search for what they can see.
 *
 * Place names and brands are stored as English free text and searched with a
 * `contains` on those same columns, so once the UI started showing "القاهرة"
 * a reader who typed it back got nothing — the word appears nowhere in the
 * data. Mature marketplaces avoid this by storing a canonical id against a
 * reference table carrying both names and indexing both; short of that
 * migration, the equivalent is to expand the query to the canonical value
 * before it reaches the database.
 *
 * The map is derived from the message files the UI renders from, so the two
 * cannot drift: anything displayed in Arabic is searchable in Arabic by
 * construction.
 */

/** Arabic display form → every English value that renders as it. */
function buildAliasIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();

  const add = (arabic: string, english: string) => {
    const key = arabic.trim();
    if (!key) return;
    const existing = index.get(key);
    if (existing) {
      if (!existing.includes(english)) existing.push(english);
    } else {
      index.set(key, [english]);
    }
  };

  // Places resolve to the code or slug now stored in the column, and every
  // spelling the UI can show — English and Arabic alike — has to reach it.
  for (const [surface, canonicals] of placeAliasIndex()) {
    for (const canonical of canonicals) add(surface, canonical);
  }

  // Car attributes are still stored as their English value, so only the Arabic
  // display form needs widening.
  const groups: Record<string, string>[] = [
    arCarAttributes.make,
    arCarAttributes.fuel,
    arCarAttributes.body,
    arCarAttributes.transmission,
    arCarAttributes.color,
  ];

  for (const group of groups) {
    for (const [english, arabic] of Object.entries(group)) {
      add(arabic, english);
    }
  }

  return index;
}

const ALIASES = buildAliasIndex();

/** Below this, a substring match is noise rather than a filter. */
const MIN_TEXT_MATCH_LENGTH = 3;

/**
 * Arabic definite article, and the alef forms that are written
 * interchangeably. A reader typing "القاهره" or "قاهرة" means "القاهرة".
 */
function normalizeArabic(value: string): string {
  return value
    .trim()
    .replace(/[\u064B-\u0652\u0670]/g, "") // diacritics
    .replace(/[\u0623\u0625\u0622]/g, "\u0627") // أ إ آ → ا
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/\u0629/g, "\u0647"); // ة → ه
}

const NORMALIZED = new Map<string, string[]>();
for (const [arabic, english] of ALIASES) {
  const key = normalizeArabic(arabic);
  const existing = NORMALIZED.get(key);
  if (existing) {
    for (const value of english) {
      if (!existing.includes(value)) existing.push(value);
    }
  } else {
    NORMALIZED.set(key, [...english]);
  }
}

/**
 * The search term plus any canonical English values it stands for.
 *
 * Always includes the original: a term may be a dealership name, an address or
 * a model, none of which this knows about. Returns unique values so a caller
 * can build one OR per variant.
 */
export function expandSearchTerm(term: string): string[] {
  const trimmed = term?.trim();
  if (!trimmed) return [];

  const direct = ALIASES.get(trimmed) ?? [];
  const normalized = NORMALIZED.get(normalizeArabic(trimmed)) ?? [];

  return [...new Set([trimmed, ...direct, ...normalized])];
}

/**
 * The variants that are safe to use in a substring or prefix match.
 *
 * Governorate codes are short — Cairo's is "C" — and a `contains "C"` or a
 * `c:*` tsquery prefix matches almost every row in the table. Columns holding
 * a canonical value should be compared with equality instead, and only these
 * longer variants fed to the text matchers.
 */
export function expandSearchTermForText(term: string): string[] {
  const [original, ...aliases] = expandSearchTerm(term);
  if (original === undefined) return [];

  // The reader's own words are never dropped, however short — "X5" and "A4"
  // are real models. Only the canonical values this module adds are filtered,
  // since those were never asked for.
  return [
    original,
    ...aliases.filter((alias) => alias.length >= MIN_TEXT_MATCH_LENGTH),
  ];
}

/** True when the term maps to at least one stored value. */
export function hasAlias(term: string): boolean {
  return expandSearchTerm(term).length > 1;
}
