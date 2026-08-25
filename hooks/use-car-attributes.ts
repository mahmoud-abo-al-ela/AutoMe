"use client";

import { useTranslations } from "next-intl";

/**
 * Display labels for the car attribute values stored on `Car`.
 *
 * `fuelType`, `bodyType`, `transmission` and `color` are stored as English
 * strings (they come from the fixed lists in lib/constants/car-options), so the
 * stored value doubles as the message key. Translating them at render keeps the
 * data untouched — filters, search and the AI extractor all keep matching on
 * the canonical English.
 *
 * Every lookup falls back to the stored value. Dealers can and do enter colours
 * that are not in the list, and per the i18n rule an unmapped value must render
 * as the original rather than disappear or show a raw key path.
 */
export function useCarAttributes() {
  const t = useTranslations("carAttributes");

  const lookup = (group: string, value?: string | null) => {
    if (!value) return "";
    const key = `${group}.${value}`;
    return t.has(key) ? t(key) : value;
  };

  return {
    fuel: (value?: string | null) => lookup("fuel", value),
    body: (value?: string | null) => lookup("body", value),
    transmission: (value?: string | null) => lookup("transmission", value),
    // Colour keys are lower-cased in the constants map, and dealers enter
    // "Silver" as often as "silver".
    color: (value?: string | null) =>
      lookup("color", value?.toLowerCase().trim()) || value || "",
  };
}
