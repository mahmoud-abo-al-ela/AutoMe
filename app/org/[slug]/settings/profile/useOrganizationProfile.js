import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getOrganizationProfile,
  updateOrganizationProfile,
} from "@/actions/settings";
import { getCities, getCountries, getStates } from "@/actions/locations";

const emptyProfile = {
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

const normalizeProfile = (profile) => ({
  ...emptyProfile,
  ...profile,
  email: profile.email || "",
  phone: profile.phone || "",
  website: profile.website || "",
  address: profile.address || "",
  description: profile.description || "",
  city: profile.city || "",
  region: profile.region || "",
  country: profile.country || "EG",
});

export function useOrganizationProfile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [saving, setSaving] = useState(false);

  const countryOptions = countries.map((country) => ({
    value: country.code,
    label: `${country.emoji ? `${country.emoji} ` : ""}${country.name}`,
  }));
  const stateOptions = states.map((state) => ({
    value: state.code,
    label: state.name,
  }));
  const cityOptions = cities.map((city) => ({
    value: city.name,
    label: city.name,
  }));

  const loadCities = async (countryCode, stateCode) => {
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
      toast.error(error.message || "Failed to load cities");
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadStates = async (countryCode, savedRegion = "") => {
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
      toast.error(error.message || "Failed to load states");
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
        toast.error(error.message || "Failed to load organization profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleCountryChange = async (countryCode) => {
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

  const handleStateChange = async (stateCode) => {
    const selectedState = states.find((state) => state.code === stateCode);

    setSelectedStateCode(stateCode);
    setProfile((current) => ({
      ...current,
      region: selectedState?.name || "",
      city: "",
    }));

    await loadCities(profile.country, stateCode);
  };

  const handleSubmit = async (event) => {
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
      toast.error(error.message || "Failed to update organization profile");
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
