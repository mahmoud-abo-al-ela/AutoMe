"use client";

import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { useFormatters } from "@/hooks/use-formatters";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { priceVerdict } from "@/lib/utils/price-verdict";
import type { AttentionReason, InventoryRow } from "@/lib/services/dashboard";
import { cn } from "@/lib/utils";

/** The car as the dealer titled it in the page's language, else make, model and year. */
export function useCarName() {
  const locale = useLocale() as Locale;
  const fmt = useFormatters();
  return (car: InventoryRow) =>
    resolveCarTitle(car, locale)?.text ?? `${car.make} ${car.model} ${fmt.number(car.year, { useGrouping: false })}`;
}

/** The words the table puts beside numbers: days listed, price vs similar cars, the reason to look. */
export function useLedgerText() {
  const t = useTranslations("org.cars.ledger");
  const tReason = useTranslations("org.dashboard.today.attention");
  const fmt = useFormatters();
  const percent = (value: number) => fmt.number(Math.abs(value) / 100, { style: "percent", maximumFractionDigits: 0 });

  return {
    days: (count: number) => t("days", { count, value: fmt.number(count) }),
    saves: (count: number) => t("savesCount", { count, value: fmt.number(count) }),
    market: (value: number | null) => {
      const verdict = priceVerdict(value);
      if (verdict === "unknown" || value === null) return { verdict, text: t("market.unknown") };
      if (verdict === "fair") return { verdict, text: t("market.fair") };
      return { verdict, text: t(`market.${verdict}`, { percent: percent(value) }) };
    },
    reason: (reason: AttentionReason) =>
      reason.kind === "stale"
        ? tReason("stale", { days: fmt.number(reason.days) })
        : reason.kind === "price"
          ? tReason("price", { percent: percent(reason.percent) })
          : tReason("photos", { count: reason.count, value: fmt.number(reason.count) }),
  };
}

/** Stale is the loudest reason (brick); price and photos read as amber. */
export const reasonTone = (reason: AttentionReason) => (reason.kind === "stale" ? "text-destructive" : "text-[#8a5e00]");

export const MARKET_TONE = {
  below: "text-price-below",
  above: "text-price-above",
  fair: "text-muted-foreground",
  unknown: "text-muted-foreground",
} as const;

const STATUS_TONE = {
  AVAILABLE: "bg-positive-soft text-positive",
  UNAVAILABLE: "bg-muted text-foreground",
  SOLD: "bg-[#e7eef8] text-[#1d4e9e]",
} as const;

export function StatusPill({ status }: { status: InventoryRow["status"] }) {
  const t = useTranslations("org.cars.ledger.status");
  return (
    <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-micro font-semibold", STATUS_TONE[status])}>
      {t(status)}
    </span>
  );
}

/** Beside the status: this car is featured on the dealership's storefront. Amber text on soft marker, 5.4:1. */
export function FeaturedTag() {
  const t = useTranslations("org.cars.ledger.table");
  return (
    <span className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full bg-marker-soft px-2.5 text-micro font-semibold text-[#8a5e00]">
      <Star aria-hidden className="size-3.5 fill-current" />
      {t("featured")}
    </span>
  );
}

export { CarThumb } from "../../../_components/CarThumb";
