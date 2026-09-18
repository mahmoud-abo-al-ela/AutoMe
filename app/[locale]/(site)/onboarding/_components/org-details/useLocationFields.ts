"use client";

import { useEgyptLocations } from "@/hooks/use-egypt-locations";
import { EGYPT_COUNTRY_CODE } from "@/lib/locations/data";
import type {
  OnboardingLocation,
  OnboardingLocationPatch,
} from "../../_lib/onboarding-types";

/**
 * Country → governorate → city cascade, matching the org profile settings page.
 *
 * Onboarding previously collected a single free-text address, so every
 * organization landed with null city/region/country and could not be filtered
 * or sorted by location until the owner went and edited their profile.
 *
 * The options now come from `lib/locations` rather than from
 * three awaited calls to an external API, which is why there is no loading or
 * error state left here.
 *
 * `region` stores the governorate code and `city` stores the city slug. They
 * previously stored display names, which meant the select — keyed by code — had
 * to find its own value again by matching the saved name, and anything
 * rendering the value had to translate a string whose spelling came from a
 * third party.
 */
export function useLocationFields({
  value,
  onChange,
}: {
  value: OnboardingLocation;
  onChange: (patch: OnboardingLocationPatch) => void;
}) {
  const { countryOptions, governorateOptions, cityOptions } = useEgyptLocations(
    value.region
  );

  return {
    countryOptions,
    stateOptions: governorateOptions,
    cityOptions,
    selectedStateCode: value.region,

    handleCountryChange: (country: string) =>
      onChange({ country, region: "", city: "" }),

    // Changing governorate clears the city: the old one belongs to a different
    // governorate and would no longer be in the list.
    handleStateChange: (region: string) => onChange({ region, city: "" }),

    handleCityChange: (city: string) => onChange({ city }),
  };
}

export { EGYPT_COUNTRY_CODE };
