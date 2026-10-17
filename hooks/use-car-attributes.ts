"use client";

import { useTranslations } from "next-intl";

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
    make: (value?: string | null) => lookup("make", value?.trim()),
  };
}
