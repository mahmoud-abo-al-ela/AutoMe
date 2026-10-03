"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Car as CarIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FairPriceGauge, PricePlate, PriceVerdictLine, SpecGrid } from "@/components/brand";
import CarCardActions from "@/components/CarCardActions";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { usePlaceNames } from "@/hooks/use-place-names";
import { useFormatters } from "@/hooks/use-formatters";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { localeDirection, type Locale } from "@/i18n/routing";
import type { SerializedCar } from "@/lib/utils/serializers";
import type { MarketPosition } from "@/lib/services/car/market-price";

type ListingRowCar = SerializedCar & { isWishlisted?: boolean; marketPosition?: MarketPosition | null };

/**
 * Desktop list view (Figma: ListingRow) — Direction B's density: the spec
 * readout beside the photo and a price block that always pairs the price
 * with its market verdict. Like the card, the whole row is one link (the
 * title's stretched ::after); Save/Compare sit above it.
 */
export function ListingRow({ car, index = 0 }: { car: ListingRowCar; index?: number }) {
  const t = useTranslations("cars.row");
  const locale = useLocale() as Locale;
  const attr = useCarAttributes();
  const place = usePlaceNames();
  const fmt = useFormatters();
  const [imageError, setImageError] = useState(false);

  const year = fmt.number(car.year, { useGrouping: false });
  const resolvedTitle = resolveCarTitle(car, locale);
  const title = resolvedTitle?.text ?? `${car.make} ${car.model}`;
  const where = [car.organization?.name, place.car(car)].filter(Boolean).join(" · ");
  const position = car.marketPosition ?? null;

  return (
    <article className="group/row relative grid grid-cols-[200px_minmax(0,1fr)_216px] gap-5 rounded-control border border-border bg-card p-4 transition-colors hover:border-border-strong focus-within:border-border-strong">
      <div className="relative aspect-[4/3] overflow-hidden rounded-plate bg-muted">
        {car.images?.[0] && !imageError ? (
          <Image
            src={car.images[0]}
            alt=""
            fill
            sizes="200px"
            className="object-cover"
            onError={() => setImageError(true)}
            priority={index < 3}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CarIcon aria-hidden className="size-9 text-muted-foreground/40" />
          </div>
        )}
        <CarCardActions carId={car.id} isWishlisted={car.isWishlisted || false} />
      </div>

      <div className="flex min-w-0 flex-col gap-2.5 py-1">
        <div className="flex items-center gap-2.5">
          <h3
            dir={resolvedTitle ? localeDirection[resolvedTitle.locale] : undefined}
            className="truncate text-h3 font-semibold"
          >
            <Link
              href={`/cars/${car.id}`}
              className="outline-none after:absolute after:inset-0 after:z-[1] after:rounded-control focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
            >
              {title}
            </Link>
          </h3>
          {/* Most dealer titles already end in the year; only add the tag when it is missing. */}
          {!title.includes(String(car.year)) && !title.includes(year) && (
            <span className="shrink-0 rounded-plate border-[1.5px] border-border-strong px-1.5 text-caption font-semibold tabular-nums">
              {year}
            </span>
          )}
        </div>
        {where && <p className="truncate text-caption text-muted-foreground">{where}</p>}
        <SpecGrid
          columns={4}
          items={[
            { label: t("mileage"), value: car.mileage != null ? fmt.mileage(car.mileage) : "—" },
            { label: t("fuel"), value: attr.fuel(car.fuelType) || "—" },
            { label: t("gearbox"), value: attr.transmission(car.transmission) || "—" },
            { label: t("body"), value: attr.body(car.bodyType) || "—" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2.5 py-1">
        <PricePlate amount={car.price} currency={car.priceCurrency} size="md" className="pointer-events-none self-start" />
        <FairPriceGauge percent={position?.percent ?? null} />
        <PriceVerdictLine percent={position?.percent ?? null} listings={position?.listings} className="[&>span:last-child]:whitespace-normal" />
        <span aria-hidden className="mt-auto inline-flex h-10 items-center justify-center rounded-control bg-inverse text-caption font-semibold text-inverse-foreground transition-colors group-hover/row:bg-inverse-hover">
          {t("viewCar")}
        </span>
      </div>
    </article>
  );
}
