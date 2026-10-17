"use client";

import { useFormatters } from "@/hooks/use-formatters";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import type { SpecKey, SpecValue } from "../_lib/compare-types";

const EMPTY = "—";

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
