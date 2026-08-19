"use client";

import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import { useLocationFields } from "./useLocationFields";
import type {
    OnboardingLocation,
    OnboardingLocationPatch,
} from "../../_lib/onboarding-types";

/**
 * Country / State / City, mirroring the org profile settings page so a
 * dealership's location is captured up front rather than left null until
 * someone edits their profile.
 */
export default function LocationFields({
    value,
    onChange,
}: {
    value: OnboardingLocation;
    onChange: (patch: OnboardingLocationPatch) => void;
}) {
    const {
        countryOptions,
        stateOptions,
        cityOptions,
        selectedStateCode,
        loadingStates,
        loadingCities,
        handleCountryChange,
        handleStateChange,
        handleCityChange,
    } = useLocationFields({ value, onChange });

    const fields = [
        {
            id: "country",
            label: "Country",
            value: value.country,
            options: countryOptions,
            placeholder: "Select a country",
            searchPlaceholder: "Search countries…",
            emptyMessage: "No countries found",
            disabled: countryOptions.length === 0,
            onValueChange: handleCountryChange,
        },
        {
            id: "region",
            label: "State / Governorate",
            value: selectedStateCode,
            options: stateOptions,
            placeholder: loadingStates ? "Loading…" : "Select a state",
            searchPlaceholder: "Search states…",
            emptyMessage: "No states found",
            disabled: !value.country || loadingStates,
            onValueChange: handleStateChange,
        },
        {
            id: "city",
            label: "City",
            value: value.city,
            options: cityOptions,
            placeholder: loadingCities ? "Loading…" : "Select a city",
            searchPlaceholder: "Search cities…",
            emptyMessage: "No cities found",
            disabled: !selectedStateCode || loadingCities,
            onValueChange: handleCityChange,
        },
    ];

    // Cells only — Step 1 owns the grid, so these line up with the text fields
    // above rather than sitting in a second grid with its own column edges.
    return (
        <>
            {fields.map((field, index) => (
                <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="space-y-2"
                >
                    <Label
                        htmlFor={field.id}
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                        {field.label}
                        <span className="text-red-500">*</span>
                    </Label>
                    <SearchableLocationSelect
                        id={field.id}
                        value={field.value}
                        options={field.options}
                        placeholder={field.placeholder}
                        searchPlaceholder={field.searchPlaceholder}
                        emptyMessage={field.emptyMessage}
                        disabled={field.disabled}
                        onValueChange={field.onValueChange}
                        triggerClassName="h-12 text-base border-gray-300"
                    />
                </motion.div>
            ))}
        </>
    );
}
