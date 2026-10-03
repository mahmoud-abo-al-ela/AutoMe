"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Car as CarIcon } from "lucide-react";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { usePlaceNames } from "@/hooks/use-place-names";
import { useFormatters } from "@/hooks/use-formatters";
import { Link, usePathname } from "@/i18n/navigation";
import { PricePlate, PriceVerdictLine } from "@/components/brand";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { localeDirection, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import CarCardActions from "./CarCardActions";
import type { SerializedCar } from "@/lib/utils/serializers";
import type { MarketPosition } from "@/lib/services/car/market-price";

/**
 * Cards are rendered from several sources (featured, listings, wishlist), which
 * agree on the serialized car but differ on what rode along — the wishlist
 * flag and the market position — so both are optional here rather than part
 * of SerializedCar.
 */
type CarCardCar = SerializedCar & {
  isWishlisted?: boolean;
  marketPosition?: MarketPosition | null;
};

/**
 * Listing card (Figma: CarCard, Grid and Compact).
 *
 * Responsive by CSS rather than by prop: below `sm` it is the 2-up phone card
 * (4:3 photo, two-line title, year · km, no compare), from `sm` the full card.
 * Doing it in CSS keeps one server render valid at every width — a JS
 * breakpoint would hydrate the wrong card first.
 *
 * The photo stays clean except for the two things that belong on it: the
 * price plate at the reading start and Save/Compare at the end. The whole
 * card is one link (the title's stretched ::after); the action buttons sit
 * above it as siblings, never nested inside the link.
 */
const CarCard = ({
  car,
  onWishlistChange,
  index = 0,
}: {
  car: CarCardCar;
  onWishlistChange?: (removedCarId: string) => void;
  index?: number;
}) => {
  const tStatus = useTranslations("carDetail.header");
  const locale = useLocale() as Locale;
  const attr = useCarAttributes();
  const place = usePlaceNames();
  const fmt = useFormatters();
  const pathname = usePathname();
  const [imageError, setImageError] = useState(false);
  const sold = car.status === "SOLD";

  // A year is a number but never a quantity: grouping would render 2020 as
  // "2,020" in English and "٢٬٠٢٠" in Arabic.
  const year = fmt.number(car.year, { useGrouping: false });

  // The generated form stays as the last resort: a car with no stored title in
  // any language still needs a heading.
  const resolvedTitle = resolveCarTitle(car, locale);
  const carTitle = resolvedTitle?.text ?? `${year} ${car.make} ${car.model}`;
  const mileage = car.mileage != null ? fmt.mileage(car.mileage) : null;
  const gearbox = attr.transmission(car.transmission);
  const where = [car.organization?.name, place.car(car)].filter(Boolean).join(" · ");

  return (
    <article className="group/card relative flex h-full flex-col overflow-hidden rounded-control border border-border bg-card transition-colors hover:border-border-strong focus-within:border-border-strong">
      <div className="relative aspect-[4/3] bg-muted sm:aspect-[3/2]">
        {car.images?.[0] && !imageError ? (
          <Image
            src={car.images[0]}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-500 ease-out motion-safe:group-hover/card:scale-[1.03]",
              sold && "opacity-45"
            )}
            onError={() => setImageError(true)}
            priority={index < 4}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CarIcon aria-hidden className="size-10 text-muted-foreground/40" />
          </div>
        )}
        <PricePlate
          amount={car.price}
          currency={car.priceCurrency}
          size="sm"
          className={cn("pointer-events-none absolute bottom-2 start-2 z-[5] sm:bottom-3 sm:start-3", sold && "opacity-70")}
        />
        {sold && (
          <span className="pointer-events-none absolute start-2 top-2 z-[5] rounded-plate bg-destructive-soft px-2 py-0.5 text-micro font-medium text-destructive sm:start-3 sm:top-3">
            {tStatus("statusSold")}
          </span>
        )}
        <CarCardActions
          carId={car.id}
          isWishlisted={car.isWishlisted || false}
          onWishlistChange={onWishlistChange}
          isWishlistPage={pathname === "/wishlist"}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:gap-1.5 sm:p-4">
        <h3
          // dir follows the title's own language, so an untranslated English
          // title inside an RTL card does not render reordered.
          dir={resolvedTitle ? localeDirection[resolvedTitle.locale] : undefined}
          className="line-clamp-2 text-start text-caption font-semibold sm:line-clamp-1 sm:text-[1.0625rem] sm:leading-6"
        >
          <Link
            href={`/cars/${car.id}`}
            className="outline-none after:absolute after:inset-0 after:z-[1] after:rounded-control focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
          >
            {carTitle}
          </Link>
        </h3>
        <p className="truncate text-micro text-muted-foreground sm:text-caption">
          {[year, mileage].filter(Boolean).join(" · ")}
          {gearbox && <span className="max-sm:hidden"> · {gearbox}</span>}
        </p>
        {!sold && (
          <PriceVerdictLine
            percent={car.marketPosition?.percent ?? null}
            listings={car.marketPosition?.listings}
            countClassName="max-sm:hidden"
          />
        )}
        {where && <p className="mt-auto truncate pt-1.5 text-micro text-muted-foreground max-sm:hidden">{where}</p>}
      </div>
    </article>
  );
};

export default CarCard;
