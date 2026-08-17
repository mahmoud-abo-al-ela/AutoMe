import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  getOrganizationProfile,
  updateOrganizationProfile,
} from "@/actions/settings";
import { getCities, getCountries, getStates } from "@/actions/locations";
import type {
  CityOption,
  CountryOption,
  StateOption,
} from "@/lib/services/locations/country-state-city";
import type { OrganizationProfileInput } from "@/lib/validations/schemas";

/**
 * The form's own shape. `organizationProfileSchema` allows `null`/`undefined`
 * on the optional fields, but controlled inputs need a string, so every field
 * is normalized to `""` here. Still assignable to `OrganizationProfileInput`,
 * which is what `updateOrganizationProfile` validates.
 */
export type OrganizationProfileFormState = {
  [K in keyof OrganizationProfileInput]-?: string;
};

/** What `SearchableLocationSelect` consumes. */
export interface SelectOption {
  value: string;
  label: string;
}

const emptyProfile: OrganizationProfileFormState = {
  name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  description: "",
  city: "",
  region: "",
  country: "EG",
};

// `findOrganizationProfile` is a `findUnique`, so the profile can be null for a
// deleted organization; fall back to the empty form rather than throwing.
const normalizeProfile = (
  // Loose on purpose: the stored organization columns are all nullable, and the
  // record carries extra fields (id, slug, logo) the form does not use.
  profile:
    | Partial<Record<keyof OrganizationProfileFormState, string | null>>
    | null
    | undefined,
): OrganizationProfileFormState => ({
  ...emptyProfile,
  ...profile,
  name: profile?.name || "",
  email: profile?.email || "",
  phone: profile?.phone || "",
  website: profile?.website || "",
  address: profile?.address || "",
  description: profile?.description || "",
  city: profile?.city || "",
  region: profile?.region || "",
  country: profile?.country || "EG",
});

export function useOrganizationProfile() {
  const [profile, setProfile] = useState<OrganizationProfileFormState>(emptyProfile);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [saving, setSaving] = useState(false);

  const countryOptions: SelectOption[] = countries.map((country) => ({
    value: country.code,
    label: `${country.emoji ? `${country.emoji} ` : ""}${country.name}`,
  }));
  const stateOptions: SelectOption[] = states.map((state) => ({
    value: state.code,
    label: state.name,
  }));
  const cityOptions: SelectOption[] = cities.map((city) => ({
    value: city.name,
    label: city.name,
  }));

  const loadCities = async (countryCode: string, stateCode: string) => {
    if (!countryCode || !stateCode) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    try {
      const response = await getCities(countryCode, stateCode);
      if (!response.success) {
        toast.error(response.error?.message || "Failed to load cities");
        setCities([]);
        return;
      }

      setCities(response.data || []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load cities",
      );
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadStates = async (countryCode: string, savedRegion = "") => {
    if (!countryCode) {
      setStates([]);
      setSelectedStateCode("");
      return;
    }

    setLoadingStates(true);
    try {
      const response = await getStates(countryCode);
      if (!response.success) {
        toast.error(response.error?.message || "Failed to load states");
        setStates([]);
        setSelectedStateCode("");
        return;
      }

      const stateOptions = response.data || [];
      const selectedState = stateOptions.find(
        (state) => state.name === savedRegion,
      );

      setStates(stateOptions);
      setSelectedStateCode(selectedState?.code || "");

      if (selectedState?.code) {
        await loadCities(countryCode, selectedState.code);
      } else {
        setCities([]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load states",
      );
      setStates([]);
      setSelectedStateCode("");
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileResponse, countriesResponse] = await Promise.all([
          getOrganizationProfile(),
          getCountries(),
        ]);

        if (!profileResponse.success) {
          toast.error(
            profileResponse.error?.message ||
              "Failed to load organization profile",
          );
          return;
        }

        if (!countriesResponse.success) {
          toast.error(
            countriesResponse.error?.message || "Failed to load countries",
          );
          return;
        }

        const normalizedProfile = normalizeProfile(
          profileResponse.data.profile,
        );

        setCountries(countriesResponse.data || []);
        setProfile(normalizedProfile);
        await loadStates(normalizedProfile.country, normalizedProfile.region);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load organization profile",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (
    field: keyof OrganizationProfileFormState,
    value: string,
  ) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleCountryChange = async (countryCode: string) => {
    setProfile((current) => ({
      ...current,
      country: countryCode,
      region: "",
      city: "",
    }));
    setCities([]);
    setSelectedStateCode("");
    await loadStates(countryCode);
  };

  const handleStateChange = async (stateCode: string) => {
    const selectedState = states.find((state) => state.code === stateCode);

    setSelectedStateCode(stateCode);
    setProfile((current) => ({
      ...current,
      region: selectedState?.name || "",
      city: "",
    }));

    await loadCities(profile.country, stateCode);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await updateOrganizationProfile(profile);
      if (!response.success) {
        toast.error(
          response.error?.message || "Failed to update organization profile",
        );
        return;
      }

      setProfile(normalizeProfile(response.data));
      toast.success(
        response.message || "Organization profile updated successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update organization profile",
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    countryOptions,
    stateOptions,
    cityOptions,
    selectedStateCode,
    loadingStates,
    loadingCities,
    updateField,
    handleCountryChange,
    handleStateChange,
    handleSubmit,
  };
}
