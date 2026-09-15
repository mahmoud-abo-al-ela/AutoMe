"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";
import {
  EGYPT_COUNTRY_CODE,
  EGYPT_GOVERNORATES,
  findGovernorate,
} from "@/lib/constants/egypt-locations";

/** What `SearchableLocationSelect` consumes. */
export interface LocationOption {
  value: string;
  label: string;
}

/**
 * Options for the country → governorate → city cascade, read straight from
 * `lib/constants/egypt-locations`.
 *
 * Replaces three awaited round-trips to an external API that stood on the
 * critical path of onboarding a dealer. Because the data is local, there is no
 * loading state, no failure path and no toast to write: the options are simply
 * there on first paint, and the two forms that use this lost about eighty lines
 * of effects and error handling between them.
 *
 * Labels follow the active locale, so a dealer onboarding in Arabic picks from
 * an Arabic list. The **values are codes and slugs**, never display names, so
 * what gets stored does not change when the reader's language does.
 */
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
