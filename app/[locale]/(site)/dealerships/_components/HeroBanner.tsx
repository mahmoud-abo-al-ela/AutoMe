"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Dealerships page header — the same shape as Browse (title, live summary,
 * search) instead of the animated gradient banner it replaces.
 */
export const HeroBanner = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  stats,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  stats?: { totalDealerships?: number; totalCities?: number } | null;
}) => {
  const t = useTranslations("dealerships.hero");
  const tCommon = useTranslations("common");
  const fmt = useFormatters();

  const dealerships = stats?.totalDealerships;
  const cities = stats?.totalCities;

  // Three separate messages rather than one assembled from fragments: Arabic
  // pluralises across six forms, and the count and the city clause each need
  // their own.
  const subtitle = !dealerships
    ? t("subtitleFallback")
    : cities
      ? t("subtitleWithCities", {
          count: dealerships,
          value: fmt.number(dealerships),
          cityCount: cities,
          cityValue: fmt.number(cities),
        })
      : t("subtitle", { count: dealerships, value: fmt.number(dealerships) });

  return (
    <header className="mb-6 flex flex-col gap-5 border-b border-border pb-6 lg:mb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 font-extrabold">{t("title")}</h1>
        <p className="text-caption text-muted-foreground">{subtitle}</p>
      </div>

      <div className="relative w-full lg:max-w-xl">
        <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          value={searchQuery || ""}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={t("searchLabel")}
          className="h-12 w-full rounded-control border border-border bg-field ps-12 pe-12 text-body outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label={tCommon("actions.clearSearch")}
            title={tCommon("actions.clearSearch")}
            className="absolute end-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-plate text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </header>
  );
};

export default HeroBanner;
