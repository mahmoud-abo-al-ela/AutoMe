"use client";

import { useLocale, useTranslations } from "next-intl";

/**
 * Display names for the places stored on `Organization`.
 *
 * `city` and `region` are free-text columns filled in by dealers, so this is a
 * lookup keyed by the stored value rather than a fixed enum — the same
 * arrangement `useCarAttributes` uses for the car attribute values, and for the
 * same reason: translating at render leaves the data untouched, so filters,
 * facets and search keep matching on the canonical English.
 *
 * Every lookup falls back to the stored value. Dealers type place names freely
 * ("Al Maḩallah al Kubrá" appears in live data), and per the i18n rule an
 * unmapped value renders as the original rather than disappearing or showing a
 * raw key path.
 */
export function usePlaceNames() {
  const t = useTranslations("places");
  const locale = useLocale();

  type Group = "cities" | "regions" | "countries";

  const lookup = (group: Group, value?: string | null) => {
    if (!value) return "";
    const key = `${group}.${value.trim()}`;
    return t.has(key) ? t(key) : value;
  };

  /**
   * A place that may be any of the three. Dealers fill `city` and `region`
   * inconsistently, so a value stored as a city on one row is a region on the
   * next; this tries each before giving up.
   */
  const anyPlace = (value?: string | null) => {
    if (!value) return "";
    const trimmed = value.trim();

    for (const group of ["cities", "regions", "countries"] as const) {
      const found = lookup(group, trimmed);
      if (found !== trimmed) return found;
    }
    return trimmed;
  };

  return {
    city: (value?: string | null) => lookup("cities", value),
    region: (value?: string | null) => lookup("regions", value),
    place: anyPlace,
    /**
     * `Car.location` is one free-text field holding a composed place —
     * "Cairo, Egypt" throughout the seed data. Each part is translated
     * separately and rejoined with the Arabic comma, so an unmapped part still
     * shows as the dealer typed it.
     */
    location: (value?: string | null) => {
      if (!value) return "";

      const separator = /[,،]/;
      if (!separator.test(value)) return anyPlace(value);

      const parts = value
        .split(separator)
        .map((part) => anyPlace(part))
        .filter(Boolean);

      // Arabic uses its own comma.
      return parts.join(locale === "ar" ? "، " : ", ");
    },
  };
}
