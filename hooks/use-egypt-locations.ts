"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";
import {
  EGYPT_COUNTRY_CODE,
  EGYPT_GOVERNORATES,
  findGovernorate,
} from "@/lib/locations/data";

/** What `SearchableLocationSelect` consumes. */
export interface LocationOption {
  value: string;
  label: string;
}

export function useEgyptLocations(governorateCode?: string | null) {
  const locale = useLocale();

  return useMemo(() => {
    const label = (entry: { en: string; ar: string }) =>
      locale === "ar" ? entry.ar : entry.en;

    const byLabel = (first: LocationOption, second: LocationOption) =>
      first.label.localeCompare(second.label, locale);

    // Egypt-only product. Kept as a list so the field keeps working unchanged
    // if that ever stops being true.
    const countryOptions: LocationOption[] = [
      {
        value: EGYPT_COUNTRY_CODE,
        label: locale === "ar" ? "مصر" : "Egypt",
      },
    ];

    const governorateOptions: LocationOption[] = EGYPT_GOVERNORATES.map(
      (governorate) => ({ value: governorate.code, label: label(governorate) })
    ).sort(byLabel);

    const cityOptions: LocationOption[] = (
      findGovernorate(governorateCode)?.cities ?? []
    )
      .map((city) => ({ value: city.slug, label: label(city) }))
      .sort(byLabel);

    return { countryOptions, governorateOptions, cityOptions };
  }, [locale, governorateCode]);
}
