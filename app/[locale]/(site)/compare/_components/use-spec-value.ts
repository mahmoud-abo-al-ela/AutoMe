"use client";

import { useFormatters } from "@/hooks/use-formatters";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import type { SpecKey, SpecValue } from "../_lib/compare-types";

const EMPTY = "—";

/**
 * Renders one comparison cell in the page's language: the locale's digits, the
 * EGP format, and the translated name of an enum value ("SUV" → "دفع رباعي").
 *
 * The spec definitions used to carry their own `format` — written once, with
 * no locale — so the Arabic table showed "EGP 875,000", Western-digit years
 * and English body types. A key without an entry here (model) is free text
 * and shown as entered.
 */
export function useSpecValue() {
  const fmt = useFormatters();
  const attr = useCarAttributes();

  const byKey: Partial<Record<SpecKey, (value: SpecValue) => string>> = {
    make: (value) => attr.make(String(value)),
    // A year is a number but never a quantity, so it is not grouped.
    year: (value) => fmt.number(Number(value), { useGrouping: false }),
    price: (value) => fmt.price(Number(value)),
    bodyType: (value) => attr.body(String(value)),
    mileage: (value) => fmt.mileage(Number(value)),
    fuelType: (value) => attr.fuel(String(value)),
    transmission: (value) => attr.transmission(String(value)),
    color: (value) => attr.color(String(value)),
    seats: (value) => fmt.number(Number(value)),
  };

  return (key: SpecKey, value: SpecValue): string => {
    if (value == null || value === "") return EMPTY;
    return byKey[key]?.(value) || String(value);
  };
}
