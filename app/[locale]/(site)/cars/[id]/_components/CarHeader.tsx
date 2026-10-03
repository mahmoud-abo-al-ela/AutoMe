"use client";

import { useTranslations, useLocale } from "next-intl";
import { Clock, Star } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import type { CarDetail } from "../_lib/car-detail-types";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { localeDirection, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  AVAILABLE: "bg-positive-soft text-positive",
  SOLD: "bg-destructive-soft text-destructive",
  UNAVAILABLE: "bg-muted text-muted-foreground",
} as const;

const STATUS_KEY = { AVAILABLE: "statusAvailable", SOLD: "statusSold", UNAVAILABLE: "statusUnavailable" } as const;

/**
 * Status, title and listing age (Figma: Badge, Heading/H1). Status is always
 * a word as well as a colour.
 */
const CarHeader = ({ car }: { car: CarDetail }) => {
  const t = useTranslations("carDetail.header");
  const fmt = useFormatters();
  const locale = useLocale() as Locale;
  const resolvedTitle = resolveCarTitle(car, locale);
  // This was ~50 lines of hand-rolled date arithmetic that hardcoded English
  // words and English pluralisation, which cannot be expressed for Arabic.
  const listedText = car.createdAt ? t("listed", { when: fmt.relativeToNow(car.createdAt) }) : null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {car.status in STATUS_STYLE && (
          <span className={cn("rounded-plate px-2 py-0.5 text-micro font-medium", STATUS_STYLE[car.status])}>
            {t(STATUS_KEY[car.status])}
          </span>
        )}
        {car.featured && (
          <span className="inline-flex items-center gap-1 rounded-plate bg-marker px-2 py-0.5 text-micro font-medium text-marker-foreground">
            <Star aria-hidden className="size-3 fill-current" />
            {t("featured")}
          </span>
        )}
      </div>

      <h1
        id="car-title"
        dir={resolvedTitle ? localeDirection[resolvedTitle.locale] : undefined}
        className="text-start text-h2 font-bold"
      >
        {resolvedTitle?.text ?? `${fmt.number(car.year, { useGrouping: false })} ${car.make} ${car.model}`}
      </h1>

      {listedText && (
        <p className="flex items-center gap-1.5 text-micro text-muted-foreground">
          <Clock aria-hidden className="size-3.5" />
          {listedText}
        </p>
      )}
    </div>
  );
};

export default CarHeader;
