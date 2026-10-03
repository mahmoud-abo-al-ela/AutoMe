"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { usePlaceNames } from "@/hooks/use-place-names";
import { SpecGrid } from "@/components/brand";
import type { CarDetail } from "../_lib/car-detail-types";

/**
 * The spec readout (Figma: SpecCell) — Direction B's spec sheet, hairline
 * cells, no icon tiles. `compact` is the six facts a buyer checks first and
 * sits directly under the gallery; `full` adds colour, seats and status for
 * the Specifications tab.
 */
const CarSpecifications = ({
  car,
  variant = "compact",
}: {
  car: CarDetail | null;
  variant?: "compact" | "full";
}) => {
  const t = useTranslations("carDetail.specs");
  const tFields = useTranslations("carAttributes.fields");
  const tHeader = useTranslations("carDetail.header");
  const fmt = useFormatters();
  const attr = useCarAttributes();
  const place = usePlaceNames();

  // Hooks must run before any early return.
  if (!car) return null;

  // Maps the CarStatus enum to a translated label. Rendering car.status
  // directly printed the raw "AVAILABLE" in both languages.
  const statusLabel =
    car.status === "SOLD"
      ? tHeader("statusSold")
      : car.status === "UNAVAILABLE"
        ? tHeader("statusUnavailable")
        : tHeader("statusAvailable");
  const orNone = (value: string | null | undefined) => value || t("notSpecified");

  const items = [
    { label: tFields("year"), value: fmt.number(car.year, { useGrouping: false }) },
    { label: tFields("mileage"), value: fmt.mileage(car.mileage) },
    { label: tFields("transmission"), value: orNone(attr.transmission(car.transmission)) },
    { label: tFields("fuelType"), value: orNone(attr.fuel(car.fuelType)) },
    { label: tFields("bodyType"), value: orNone(attr.body(car.bodyType)) },
    { label: tFields("location"), value: orNone(place.car(car)) },
    ...(variant === "full"
      ? [
          { label: tFields("color"), value: orNone(attr.color(car.color)) },
          {
            label: tFields("seats"),
            value: car.seats ? t("seatsValue", { count: fmt.number(car.seats) }) : t("notSpecified"),
          },
          { label: tFields("status"), value: statusLabel },
        ]
      : []),
  ];

  return (
    <section aria-label={variant === "full" ? t("title") : t("keyTitle")}>
      {variant === "full" && <p className="mb-3 text-caption text-muted-foreground">{t("subtitle")}</p>}
      <SpecGrid items={items} columns={3} />
    </section>
  );
};

export default CarSpecifications;
