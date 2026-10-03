"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { MarketReadout, type MarketSummary } from "@/components/brand";
import { BUDGET_MAX_EGP, LUXURY_MIN_EGP } from "@/lib/constants/car-options";
import type { CarsFilters } from "../_lib/cars-types";

/**
 * Structured quick picks map to real filters, not free-text search — so
 * "Under …" and "Luxury" actually return matching cars. The thresholds live
 * with the other car options so the home hero uses the same ones.
 */
const QUICK_PICKS: { key: string; patch: Partial<CarsFilters> }[] = [
  { key: "quickSuv", patch: { bodyType: ["SUV"] } },
  { key: "quickElectric", patch: { fuelType: ["Electric"] } },
  { key: "quickUnder", patch: { maxPrice: BUDGET_MAX_EGP } },
  { key: "quickLuxury", patch: { minPrice: LUXURY_MIN_EGP } },
];

/**
 * Browse page header (Figma: Browse — desktop). Replaces the animated gradient
 * hero, which pushed the first result ~180px further down: a title, the live
 * market readout, the search field and the quick picks — then straight into
 * results.
 */
export const CarsHero = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onQuickPick,
  summary,
}: {
  searchQuery?: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onQuickPick: (patch: Partial<CarsFilters>) => void;
  summary?: MarketSummary | null;
}) => {
  const t = useTranslations("cars");
  const fmt = useFormatters();
  const query = searchQuery || "";

  return (
    <header className="mb-6 flex flex-col gap-5 border-b border-border pb-6 lg:mb-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <h1 className="text-h1 font-extrabold">{t("browse.title")}</h1>
        {summary && summary.listings > 0 && <MarketReadout summary={summary} />}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="relative w-full lg:max-w-xl">
          <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("hero.searchPlaceholder")}
            aria-label={t("hero.searchLabel")}
            className="h-12 w-full rounded-control border border-border bg-field ps-12 pe-12 text-body outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label={t("hero.clearSearch")}
              title={t("hero.clearSearch")}
              className="absolute end-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-plate text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          {QUICK_PICKS.map(({ key, patch }) => (
            <li key={key} className="shrink-0">
              <button
                type="button"
                onClick={() => onQuickPick(patch)}
                className="inline-flex h-10 items-center rounded-full border border-border bg-field px-4 text-caption font-medium transition-colors hover:border-border-strong"
              >
                {t(`hero.${key}`, { price: fmt.price(BUDGET_MAX_EGP) })}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
};

export default CarsHero;
