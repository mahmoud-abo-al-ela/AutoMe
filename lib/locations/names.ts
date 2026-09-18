import type { Locale } from "@/i18n/routing";
import arPlaces from "@/messages/ar/places.json";
import enPlaces from "@/messages/en/places.json";
import {
  EGYPT_CITIES,
  EGYPT_COUNTRY_CODE,
  EGYPT_GOVERNORATES,
  type EgyptCity,
  type EgyptGovernorate,
} from "./data";
import { normalizePlaceName } from "./normalize";

/**
 * Resolving a stored place to a display name.
 *
 * `Organization.region` holds a governorate code and `Organization.city` holds
 * a city slug, so the usual lookup is by key. `Car.location` is free text a
 * dealer typed — "Cairo, Egypt" — so a name has to resolve too, in either
 * language and however it was spelled. Every lookup therefore falls through:
 *
 *   1. the code or slug, which is what the structured columns hold;
 *   2. the normalized name, for free text and for anything hand-entered;
 *   3. the value itself, so a place nobody anticipated still renders as typed
 *      rather than vanishing or showing a key path.
 *
 * Kept free of React so the search layer, which runs on the server, shares the
 * same index rather than keeping a second copy that could drift.
 */

type Entry = { en: string; ar: string };

interface Index<T extends Entry> {
  byKey: Map<string, T>;
  byName: Map<string, T>;
}

const buildIndex = <T extends Entry>(
  rows: readonly T[],
  key: (row: T) => string
): Index<T> => {
  const byKey = new Map<string, T>();
  const byName = new Map<string, T>();

  for (const row of rows) {
    byKey.set(key(row), row);
    // Only the first spelling wins, so a later duplicate cannot displace a
    // canonical entry.
    for (const name of [row.en, row.ar]) {
      const normalized = normalizePlaceName(name);
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

/**
 * Countries stay in the message files: there is no cascade to hang them off,
 * and they appear only inside free text. Keyed by the English name, which is
 * what `Car.location` holds — except Egypt, which is also stored as a code on
 * the organization.
 */
const countries = buildIndex<Entry & { key: string }>(
  Object.entries(enPlaces.countries).map(([key, en]) => ({
    key,
    en,
    ar: arPlaces.countries[key as keyof typeof arPlaces.countries],
  })),
  (row) => row.key
);
countries.byKey.set(EGYPT_COUNTRY_CODE, countries.byKey.get("Egypt")!);

const pick = (entry: Entry, locale: Locale) =>
  locale === "ar" ? entry.ar : entry.en;

const resolve = <T extends Entry>(index: Index<T>, value: string) =>
  index.byKey.get(value) ?? index.byName.get(normalizePlaceName(value));

export function governorateName(
  value: string | null | undefined,
  locale: Locale
) {
  if (!value) return "";
  const found = resolve(governorates, value.trim());
  return found ? pick(found, locale) : value;
}

export function cityName(value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const trimmed = value.trim();

  // Falls back to the governorate index because egydata is district-level:
  // there is no city called "Cairo", only its districts, and both free text and
  // a dealer filling the two fields interchangeably put the governorate's name
  // in the city column. The place is real either way, so it should render.
  const found = resolve(cities, trimmed) ?? resolve(governorates, trimmed);
  return found ? pick(found, locale) : value;
}

export function countryName(value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const found = resolve(countries, value.trim());
  return found ? pick(found, locale) : value;
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
 * Egypt". Each part is resolved on its own and rejoined with the locale's
 * comma, so an unmapped part still shows as typed.
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
