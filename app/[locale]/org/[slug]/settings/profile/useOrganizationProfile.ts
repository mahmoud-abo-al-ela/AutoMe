import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getOrganizationProfile,
  updateOrganizationProfile,
} from "@/actions/settings";
import { useEgyptLocations } from "@/hooks/use-egypt-locations";
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
  const t = useTranslations("org.settings.profile.toasts");
  const [profile, setProfile] = useState<OrganizationProfileFormState>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Options come from lib/locations, so there is nothing to
  // fetch and nothing to fail. `region` holds the governorate code, which is
  // exactly what the select is keyed by — previously it held the display name
  // and the hook had to search the fetched list for a matching name to restore
  // its own value.
  const { countryOptions, governorateOptions, cityOptions } = useEgyptLocations(
    profile.region
  );
  const stateOptions = governorateOptions;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileResponse = await getOrganizationProfile();

        if (!profileResponse.success) {
          toast.error(profileResponse.error?.message || t("loadFailed"));
          return;
        }

        const normalizedProfile = normalizeProfile(
          profileResponse.data.profile,
        );

        setProfile(normalizedProfile);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // `t` is only read inside the catch, for a toast. Listing it would refetch
    // the profile on a language switch, which is a network round trip to show
    // the same data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (
    field: keyof OrganizationProfileFormState,
    value: string,
  ) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleCountryChange = (country: string) => {
    setProfile((current) => ({ ...current, country, region: "", city: "" }));
  };

  // Changing governorate clears the city: the old one belongs to a different
  // governorate and is no longer in the list.
  const handleStateChange = (region: string) => {
    setProfile((current) => ({ ...current, region, city: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await updateOrganizationProfile(profile);
      if (!response.success) {
        toast.error(response.error?.message || t("updateFailed"));
        return;
      }

      setProfile(normalizeProfile(response.data));
      toast.success(response.message || t("updated"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("updateFailed"),
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
    selectedStateCode: profile.region,
    updateField,
    handleCountryChange,
    handleStateChange,
    handleSubmit,
  };
}
