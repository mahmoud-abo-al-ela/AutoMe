"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Car as CarIcon } from "lucide-react";
import { PricePlate } from "@/components/brand";
import { useFormatters } from "@/hooks/use-formatters";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import type { CompareCar } from "../_lib/compare-types";

/**
 * Mobile car card used in both carousel and side-by-side modes. Same text
 * helpers as CompareCarCard: Arabic title, own digits, the price plate.
 */
const MobileCarCard = ({
  car,
  compact = false,
  onRemove,
}: {
  car: CompareCar;
  compact?: boolean;
  onRemove: (carId: string) => void;
}) => {
  const tCommon = useTranslations("common.actions");
  const tCarActions = useTranslations("common.carActions");
  const locale = useLocale() as Locale;
  const fmt = useFormatters();
  const year = fmt.number(car.year, { useGrouping: false });
  const title = resolveCarTitle(car, locale)?.text ?? `${year} ${car.make} ${car.model}`;

  return (
    <div className={cn("relative p-3", compact && "p-2")}>
      <Button
        onClick={() => onRemove(car.id)}
        size="icon"
        variant="ghost"
        className="absolute end-1 top-1 z-10 size-8 rounded-full bg-field/90 hover:bg-destructive-soft hover:text-destructive"
        aria-label={`${tCarActions("removeFromCompare")}: ${title}`}
      >
        <X className="size-3.5" />
      </Button>

      <div className={cn("flex gap-3", compact && "flex-col gap-2")}>
        <div className={cn("relative overflow-hidden rounded-plate bg-muted", compact ? "aspect-[16/9] w-full" : "aspect-[4/3] w-1/3")}>
          {/* See CompareCarCard: an undefined `src` throws inside next/image. */}
          {car.images[0]?.url ? (
            <Image src={car.images[0].url} alt="" fill sizes="(max-width: 768px) 50vw, 200px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <CarIcon aria-hidden className="size-6 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className={cn("flex min-w-0 flex-col items-start gap-2", compact ? "w-full" : "w-2/3")}>
          <h3 className={cn("line-clamp-2 font-semibold", compact ? "text-micro" : "text-caption")}>{title}</h3>
          <PricePlate amount={car.price} size="sm" />
          {!compact && (
            <Button asChild variant="outline-strong" size="control" className="mt-1 w-full">
              <Link href={`/cars/${car.id}`}>
                {tCommon("viewDetails")}
                <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileCarCard;
