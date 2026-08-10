"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getCities, getCountries, getStates } from "@/actions/locations";

/**
 * Country → state → city cascade, matching the org profile settings page.
 *
 * Onboarding previously collected a single free-text address, so every
 * organization landed with null city/region/country and could not be filtered
 * or sorted by location until the owner went and edited their profile.
 */
export function useLocationFields({ value, onChange }) {
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedStateCode, setSelectedStateCode] = useState("");
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // No flag emoji: Windows ships no glyphs for regional-indicator pairs, so
    // the flag renders as the literal letters "EG" in front of "Egypt".
    const countryOptions = countries.map((country) => ({
        value: country.code,
        label: country.name,
    }));
    const stateOptions = states.map((state) => ({
        value: state.code,
        label: state.name,
    }));
    const cityOptions = cities.map((city) => ({
        value: city.name,
        label: city.name,
    }));

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const response = await getCountries();
            if (cancelled) return;
            if (!response.success) {
                toast.error(response.error?.message || "Failed to load countries");
                return;
            }
            setCountries(response.data || []);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // Load the states for whichever country is selected (defaults to EG).
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!value.country) {
                setStates([]);
                return;
            }
            setLoadingStates(true);
            try {
                const response = await getStates(value.country);
                if (cancelled) return;
                if (!response.success) {
                    toast.error(response.error?.message || "Failed to load states");
                    setStates([]);
                    return;
                }
                setStates(response.data || []);
            } finally {
                if (!cancelled) setLoadingStates(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [value.country]);

    // `region` is persisted as the state's display name, but the select is keyed
    // by code. Coming back to step 1 mid-wizard would otherwise show an empty
    // state field and a permanently disabled city field.
    useEffect(() => {
        if (selectedStateCode || !value.region || states.length === 0) return;
        const match = states.find((state) => state.name === value.region);
        if (!match) return;
        setSelectedStateCode(match.code);
        loadCities(value.country, match.code);
    }, [states, value.region, value.country, selectedStateCode]);

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
        } finally {
            setLoadingCities(false);
        }
    };

    const handleCountryChange = (countryCode) => {
        setSelectedStateCode("");
        setCities([]);
        onChange({ country: countryCode, region: "", city: "" });
    };

    const handleStateChange = async (stateCode) => {
        const state = states.find((item) => item.code === stateCode);
        setSelectedStateCode(stateCode);
        onChange({ region: state?.name || "", city: "" });
        await loadCities(value.country, stateCode);
    };

    const handleCityChange = (cityName) => {
        onChange({ city: cityName });
    };

    return {
        countryOptions,
        stateOptions,
        cityOptions,
        selectedStateCode,
        loadingStates,
        loadingCities,
        handleCountryChange,
        handleStateChange,
        handleCityChange,
    };
}
