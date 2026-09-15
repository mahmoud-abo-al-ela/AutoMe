import {
  EGYPT_CITIES,
  EGYPT_GOVERNORATES,
  type EgyptCity,
  type EgyptGovernorate,
} from "@/lib/constants/egypt-locations";
import arPlaces from "@/messages/ar/places.json";
import enPlaces from "@/messages/en/places.json";
import type { Locale } from "@/i18n/routing";

/**
 * Resolving a stored place to a display name.
 *
 * `Organization.region` holds a governorate code and `Organization.city` holds
 * a city slug, both from `lib/constants/egypt-locations`. Rows written before
 * that change hold display names instead — whatever the old location API
 * spelled them — so every lookup falls back through:
 *
 *   1. the code or slug, which is what new rows hold;
 *   2. the English display name, for rows not yet backfilled;
 *   3. the value itself, so a place nobody anticipated still renders as typed
 *      rather than vanishing or showing a key path.
 *
 * Kept free of React so the search layer, which runs on the server, can share
 * the same index rather than keeping a second copy that could drift.
 */

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[''`‘’ʻʼ-]/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(al|el)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type Entry = { en: string; ar: string };

const buildIndex = <T extends Entry>(
  rows: readonly T[],
  key: (row: T) => string
) => {
  const byKey = new Map<string, T>();
  const byName = new Map<string, T>();

  for (const row of rows) {
    byKey.set(key(row), row);
    // Only the first spelling wins, so a later duplicate cannot displace a
    // canonical entry.
    for (const name of [row.en, row.ar]) {
      const normalized = normalize(name);
      if (normalized && !byName.has(normalized)) byName.set(normalized, row);
    }
  }

  return { byKey, byName };
};

const governorates = buildIndex<EgyptGovernorate>(
  EGYPT_GOVERNORATES,
  (row) => row.code
);
const cities = buildIndex<EgyptCity & { governorate: string }>(
  EGYPT_CITIES,
  (row) => row.slug
);

/** Countries stay in the message files: there is no cascade to hang them off. */
const countries: Record<Locale, Record<string, string>> = {
  en: enPlaces.countries,
  ar: arPlaces.countries,
};

const pick = (entry: Entry, locale: Locale) =>
  locale === "ar" ? entry.ar : entry.en;

const resolve = (
  index: { byKey: Map<string, Entry>; byName: Map<string, Entry> },
  value: string
) => index.byKey.get(value) ?? index.byName.get(normalize(value));

export function governorateName(value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const found = resolve(governorates, value.trim());
  return found ? pick(found, locale) : value;
}

export function cityName(value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const found = resolve(cities, value.trim());
  return found ? pick(found, locale) : value;
}

export function countryName(value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const trimmed = value.trim();
  // Stored as an ISO code on the organization, but free text inside
  // `Car.location` ("Cairo, Egypt").
  if (trimmed === "EG") return locale === "ar" ? "مصر" : "Egypt";
  return countries[locale][trimmed] ?? value;
}

/** A place that could be any of the three — dealers are not consistent. */
export function placeName(value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const trimmed = value.trim();

  for (const resolver of [cityName, governorateName, countryName]) {
    const found = resolver(trimmed, locale);
    if (found !== trimmed) return found;
  }
  return trimmed;
}

/**
 * `Car.location` is one free-text field holding a composed place — "Cairo,
 * Egypt" throughout the seed data. Each part is resolved on its own and
 * rejoined with the locale's comma, so an unmapped part still shows as typed.
 */
export function locationName(value: string | null | undefined, locale: Locale) {
  if (!value) return "";

  const separator = /[,،]/;
  if (!separator.test(value)) return placeName(value, locale);

  const parts = value
    .split(separator)
    .map((part) => placeName(part, locale))
    .filter(Boolean);

  return parts.join(locale === "ar" ? "، " : ", ");
}

/**
 * Every English and Arabic spelling this module can resolve, paired with the
 * canonical values it resolves to. The search layer uses this to widen a query
 * before it reaches the database.
 */
export function placeAliasIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();

  const add = (surface: string, canonical: string) => {
    const key = surface.trim();
    if (!key) return;
    const existing = index.get(key);
    if (existing) {
      if (!existing.includes(canonical)) existing.push(canonical);
    } else {
      index.set(key, [canonical]);
    }
  };

  for (const governorate of EGYPT_GOVERNORATES) {
    for (const surface of [governorate.en, governorate.ar]) {
      add(surface, governorate.code);
    }
  }
  for (const city of EGYPT_CITIES) {
    for (const surface of [city.en, city.ar]) {
      add(surface, city.slug);
    }
  }

  // Countries appear inside `Car.location` as free text ("Cairo, Egypt"), so
  // the canonical value there is the English name rather than a code.
  for (const [english, arabic] of Object.entries(arPlaces.countries)) {
    add(english, english);
    add(arabic, english);
  }

  return index;
}
