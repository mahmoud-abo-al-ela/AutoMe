import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ChipFormatters } from "./cars-page-filters";
import { useFormatters } from "./use-formatters";
import { useCarAttributes } from "./use-car-attributes";
import { usePlaceNames } from "./use-place-names";

/** How each active-filter chip on the cars page reads, in the reader's language. */
export function useChipFormatters() {
  const t = useTranslations("cars.filters");
  const fmt = useFormatters();
  const attr = useCarAttributes();
  const place = usePlaceNames();

  // Chip labels are locale-dependent, so the formatters are rebuilt when the
  // locale changes and the memo is keyed on them.
  return useMemo<ChipFormatters>(
    () => ({
      any: t("any"),
      price: (v: number) => fmt.price(v),
      mileage: (v: number) => fmt.mileage(v),
      number: (v: number) => fmt.number(v, { useGrouping: false }),
      attribute: (type: string, value: string) => {
        if (type === "bodyType") return attr.body(value);
        if (type === "fuelType") return attr.fuel(value);
        if (type === "transmission") return attr.transmission(value);
        if (type === "color") return attr.color(value);
        // Brands render in their Arabic market form when they stand alone, as
        // they do on a chip. Car titles keep "{make} {model}" Latin together,
        // since the model is open-ended free text with no Arabic form.
        if (type === "make") return attr.make(value);
        return value;
      },
      place: (value: string) => place.city(value),
    }),
    [t, fmt, attr, place]
  );
}
