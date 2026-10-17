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

export function dealershipPlaceName(
  org: { city?: string | null; region?: string | null } | null | undefined,
  locale: Locale
) {
  if (!org) return "";
  const city = cityName(org.city, locale);
  const region = governorateName(org.region, locale);
  const parts = [city, region].filter(Boolean);
  const unique = parts.filter((part, i) => parts.indexOf(part) === i);
  return unique.join(locale === "ar" ? "، " : ", ");
}

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
