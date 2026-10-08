"use client";

import { useState } from "react";
import { MapPin, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useFormatters } from "@/hooks/use-formatters";
import { usePlaceNames } from "@/hooks/use-place-names";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { Link } from "@/i18n/navigation";
import { getOpenStatus } from "@/lib/utils/open-status";
import { resolveDealershipText, textDirection } from "@/lib/utils/dealership-text";
import type { DealershipListItem } from "../_lib/dealership-types";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/**
 * Dealership card (Figma: DealerCard). A dealership without a logo gets its
 * initials on a marker-yellow tile — distinct per dealer — instead of the
 * identical blue building icon every logo-less dealer used to share.
 */
const DealershipCard = ({ dealership, index = 0 }: { dealership: DealershipListItem; index?: number }) => {
  const { name, slug, logo, city, averageRating, totalReviews, carCount, brands = [], priceFrom, workingHours } =
    dealership;

  const t = useTranslations("dealerships.card");
  const fmt = useFormatters();
  const place = usePlaceNames();
  const attr = useCarAttributes();
  const [imgError, setImgError] = useState(false);

  const openStatus = workingHours?.length ? getOpenStatus(workingHours) : null;
  const showLogo = logo && !imgError;
  // The city from the place table; failing that, the dealer's address in the
  // reader's language (lib/utils/dealership-text).
  const address = city ? null : resolveDealershipText(dealership, "address", fmt.locale);
  const where = city ? place.city(city) : address?.text;

  return (
    <Link
      href={`/dealerships/${slug}`}
      className="flex h-full flex-col gap-4 rounded-control border border-border bg-card p-5 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start gap-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-control">
          {showLogo ? (
            <Image
              src={logo}
              alt=""
              fill
              sizes="56px"
              className="border border-border bg-field object-contain"
              onError={() => setImgError(true)}
              priority={index < 4}
            />
          ) : (
            <span aria-hidden className="flex size-full items-center justify-center rounded-control border-2 border-border-strong bg-marker text-[1.25rem] font-black">
              {initialsOf(name)}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-[1.0625rem] font-semibold">{name}</h3>
          <p className="flex items-center gap-1.5 text-micro">
            {totalReviews > 0 ? (
              <>
                <Star aria-hidden className="size-3.5 fill-marker text-foreground" />
                <span className="font-semibold">
                  {fmt.number(averageRating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-muted-foreground">({fmt.number(totalReviews)})</span>
              </>
            ) : (
              <span className="text-muted-foreground">{t("noReviews")}</span>
            )}
          </p>
          {(where || openStatus?.isOpen) && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-muted-foreground">
              {where && (
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden className="size-3.5 shrink-0" />
                  <span className="line-clamp-1" {...(address ? textDirection(address) : {})}>
                    {where}
                  </span>
                </span>
              )}
              {openStatus?.isOpen && (
                <span className="inline-flex items-center gap-1 font-medium text-positive">
                  <span aria-hidden className="size-1.5 rounded-full bg-positive" />
                  {t("openNow")}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {brands.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {brands.map((brand: string) => (
            <li key={brand} dir="auto" className="rounded-full border border-border bg-field px-2.5 py-0.5 text-micro">
              {attr.make(brand)}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-auto flex flex-wrap items-center gap-x-1.5 border-t border-border pt-3 text-caption">
        <span className="font-semibold">{t("carCount", { count: carCount, value: fmt.number(carCount) })}</span>
        {priceFrom ? (
          <>
            <span aria-hidden className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{t("priceFrom", { price: fmt.price(priceFrom) })}</span>
          </>
        ) : null}
      </p>
    </Link>
  );
};

export default DealershipCard;
