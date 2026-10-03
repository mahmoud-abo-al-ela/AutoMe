"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { X, ArrowRight, Car as CarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricePlate } from "@/components/brand";
import { useFormatters } from "@/hooks/use-formatters";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { resolveCarTitle } from "@/lib/utils/car-text";
import type { Locale } from "@/i18n/routing";
import type { CompareCar } from "../_lib/compare-types";

/**
 * A car at the head of a comparison column: photo, title, the price plate and
 * the year · km · fuel line, with remove and "view details".
 *
 * Text goes through the same helpers as the listing cards, so the Arabic page
 * gets the Arabic title, its own digits and translated fuel types.
 */
const CompareCarCard = ({
    car,
    onRemove,
}: {
    car: CompareCar;
    onRemove: (carId: string) => void;
}) => {
    const tCommon = useTranslations("common.actions");
    const tCarActions = useTranslations("common.carActions");
    const locale = useLocale() as Locale;
    const fmt = useFormatters();
    const attr = useCarAttributes();

    // A year is a number but never a quantity, so it is not grouped.
    const year = fmt.number(car.year, { useGrouping: false });
    const title = resolveCarTitle(car, locale)?.text ?? `${year} ${car.make} ${car.model}`;
    const facts = [year, car.mileage != null ? fmt.mileage(car.mileage) : null, attr.fuel(car.fuelType) || null]
        .filter(Boolean)
        .join(" · ");

    return (
        <article className="relative flex flex-col overflow-hidden rounded-control border border-border bg-card">
            <Button
                onClick={() => onRemove(car.id)}
                size="icon"
                variant="ghost"
                className="absolute end-2 top-2 z-10 size-9 rounded-full bg-field/90 hover:bg-destructive-soft hover:text-destructive print:hidden"
                aria-label={`${tCarActions("removeFromCompare")}: ${title}`}
            >
                <X className="size-4" />
            </Button>

            <div className="relative aspect-[3/2] bg-muted">
                {/* A car with no images used to pass an undefined `src` to
                    next/image, which throws and takes the page down. */}
                {car.images[0]?.url ? (
                    <Image src={car.images[0].url} alt="" fill sizes="(min-width: 768px) 320px, 100vw" className="object-cover" />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <CarIcon aria-hidden className="size-10 text-muted-foreground/40" />
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="line-clamp-2 text-body font-semibold">{title}</h3>
                <PricePlate amount={car.price} size="sm" className="self-start" />
                {facts && <p className="text-micro text-muted-foreground">{facts}</p>}
                <Button asChild variant="outline-strong" size="control" className="mt-auto w-full print:hidden">
                    <Link href={`/cars/${car.id}`}>
                        {tCommon("viewDetails")}
                        <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
                    </Link>
                </Button>
            </div>
        </article>
    );
};

export default CompareCarCard;
