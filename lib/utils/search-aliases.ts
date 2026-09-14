import arPlaces from "@/messages/ar/places.json";
import arCarAttributes from "@/messages/ar/carAttributes.json";

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

  const groups: Record<string, string>[] = [
    arPlaces.cities,
    arPlaces.regions,
    arPlaces.countries,
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

/** True when the term maps to at least one stored English value. */
export function hasAlias(term: string): boolean {
  return expandSearchTerm(term).length > 1;
}
