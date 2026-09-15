"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";
import {
  cityName,
  countryName,
  governorateName,
  locationName,
  placeName,
} from "@/lib/utils/place-names";
import type { Locale } from "@/i18n/routing";

/**
 * Display names for the places stored on `Organization` and `Car`.
 *
 * Thin binding over `lib/utils/place-names`, which holds the resolution rules
 * and stays React-free so the server-side search layer can share the same
 * index. See that module for how a stored value is resolved.
 */
export function usePlaceNames() {
  const locale = useLocale() as Locale;

  return useMemo(
    () => ({
      city: (value?: string | null) => cityName(value, locale),
      region: (value?: string | null) => governorateName(value, locale),
      country: (value?: string | null) => countryName(value, locale),
      place: (value?: string | null) => placeName(value, locale),
      location: (value?: string | null) => locationName(value, locale),
    }),
    [locale]
  );
}
