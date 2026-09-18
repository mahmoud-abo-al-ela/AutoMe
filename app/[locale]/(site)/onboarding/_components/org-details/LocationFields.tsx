"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
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
 *
 * The option labels come from `useEgyptLocations` and follow the active locale;
 * only the field's own copy is translated here.
 *
 * Country is shown but not editable. AutoMe serves Egypt and nothing else —
 * the list has one entry, so a select that opens onto a single option is a
 * question with no answer to give. It stays on the form because the value is
 * part of the address a dealer is confirming, not because it is a choice.
 */
export default function LocationFields({
    value,
    onChange,
}: {
    value: OnboardingLocation;
    onChange: (patch: OnboardingLocationPatch) => void;
}) {
    const t = useTranslations("onboarding.orgDetails.location");
    const {
        countryOptions,
        stateOptions,
        cityOptions,
        selectedStateCode,
        handleCountryChange,
        handleStateChange,
        handleCityChange,
    } = useLocationFields({ value, onChange });

    const fields = [
        {
            id: "country" as const,
            value: value.country,
            options: countryOptions,
            disabled: true,
            onValueChange: handleCountryChange,
        },
        {
            id: "region" as const,
            value: selectedStateCode,
            options: stateOptions,
            disabled: !value.country,
            onValueChange: handleStateChange,
        },
        {
            id: "city" as const,
            value: value.city,
            options: cityOptions,
            disabled: !selectedStateCode,
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
                        {t(`${field.id}.label`)}
                        <span className="text-red-500">*</span>
                    </Label>
                    <SearchableLocationSelect
                        id={field.id}
                        value={field.value}
                        options={field.options}
                        placeholder={t(`${field.id}.placeholder`)}
                        searchPlaceholder={t(`${field.id}.searchPlaceholder`)}
                        emptyMessage={t(`${field.id}.emptyMessage`)}
                        disabled={field.disabled}
                        onValueChange={field.onValueChange}
                        triggerClassName="h-12 text-base border-gray-300"
                    />
                </motion.div>
            ))}
        </>
    );
}
