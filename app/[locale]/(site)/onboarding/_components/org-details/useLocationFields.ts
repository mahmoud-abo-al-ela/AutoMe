"use client";

import { useEgyptLocations } from "@/hooks/use-egypt-locations";
import { EGYPT_COUNTRY_CODE } from "@/lib/locations/data";
import type {
  OnboardingLocation,
  OnboardingLocationPatch,
} from "../../_lib/onboarding-types";

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
