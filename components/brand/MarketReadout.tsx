"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";

export interface MarketSummary {
  listings: number;
  dealerships: number;
  cities: number;
  medianPrice: number | null;
  updatedAt: string | null;
}

/**
 * Direction B's market readout, in the Cairo Plate palette (Figma:
 * MarketReadout): the live state of the stock as hairline-separated figures.
 * Computed numbers only — see getMarketSummary — never marketing copy.
 * Wraps on narrow screens rather than scrolling.
 */
export function MarketReadout({ summary, className }: { summary: MarketSummary; className?: string }) {
  const t = useTranslations("cars.readout");
  const fmt = useFormatters();
  const n = (value: number) => fmt.number(value);

  const items = [
    t("live", { count: summary.listings, value: n(summary.listings) }),
    summary.medianPrice != null ? t("median", { price: fmt.price(summary.medianPrice) }) : null,
    `${t("dealers", { count: summary.dealerships, value: n(summary.dealerships) })} · ${t("cities", {
      count: summary.cities,
      value: n(summary.cities),
    })}`,
    summary.updatedAt ? t("updated", { when: fmt.relativeToNow(summary.updatedAt, { addSuffix: true }) }) : null,
  ].filter(Boolean) as string[];
  // Phones keep the first three figures; "updated" is the one that can go.
  const lastIndex = items.length - 1;

  return (
    <section aria-label={t("label")} className={cn("flex flex-wrap items-center gap-y-1.5 text-caption", className)}>
      {items.map((item, i) => (
        <span
          key={i}
          className={cn(
            "flex items-center gap-2 pe-4",
            i > 0 && "border-s border-border ps-4",
            i === 0 ? "font-semibold" : "text-muted-foreground",
            summary.updatedAt && i === lastIndex && "max-sm:hidden"
          )}
        >
          {i === 0 && <span aria-hidden className="size-2 rounded-full border border-border-strong bg-marker" />}
          {item}
        </span>
      ))}
    </section>
  );
}
