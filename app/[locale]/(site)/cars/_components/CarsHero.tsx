"use client";

import { useTranslations } from "next-intl";
import { Flame, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFormatters } from "@/hooks/use-formatters";
import type { CarsFilters } from "../_lib/cars-types";

// Structured quick-picks map to real filters, not free-text search — so
// "Under …" and "Luxury" actually return matching cars.
//
// Thresholds are EGP, matching Car.price. They were previously dollar-scale
// (30,000 / 60,000), which against EGP prices meant "Under" returned almost
// nothing and "Luxury" returned almost everything. Egyptian car prices sit far
// higher than USD ones because of import duty and taxes, so these are pitched
// against the real distribution: a little under the median for the budget pick,
// and the top slice for luxury.
const BUDGET_MAX_EGP = 1_500_000;
const LUXURY_MIN_EGP = 3_000_000;

/**
 * The filter patches are static data; their labels are not. The label used to
 * be built here at module scope, which meant `Under …` was formatted once when
 * the module first loaded and then reused for every request regardless of
 * locale. Labels are now resolved inside the component instead.
 */
const QUICK_PICKS: { key: string; patch: Partial<CarsFilters> }[] = [
  { key: "quickSuv", patch: { bodyType: ["SUV"] } },
  { key: "quickElectric", patch: { fuelType: ["Electric"] } },
  { key: "quickUnder", patch: { maxPrice: BUDGET_MAX_EGP } },
  { key: "quickLuxury", patch: { minPrice: LUXURY_MIN_EGP } },
];

export const CarsHero = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  totalCount,
  onQuickPick,
}: {
  searchQuery?: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  totalCount?: number;
  onQuickPick: (patch: Partial<CarsFilters>) => void;
}) => {
  const t = useTranslations("cars.hero");
  const fmt = useFormatters();
  const query = searchQuery || "";

  return (
    <div className="animated-gradient relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-brand-accent px-6 py-8 shadow-lg sm:px-10 sm:py-10">
      {/* Decorative floating accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute -end-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="animate-float-delayed absolute -bottom-16 -start-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-white/80 sm:text-base">
          {t("subtitle", { count: totalCount ?? 0 })}
        </p>

        {/* Search — plain text, search-as-you-type */}
        <div className="mx-auto mt-6 max-w-xl">
          <div className="group relative">
            <Search className="absolute start-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={t("searchLabel")}
              className="h-14 w-full rounded-xl border border-white/40 bg-white/95 ps-12 pe-12 text-base text-gray-900 shadow-lg placeholder:text-gray-500 focus-visible:border-white focus-visible:ring-4 focus-visible:ring-white/20"
            />
            {query && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute end-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                aria-label={t("clearSearch")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick picks */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="me-1 flex items-center text-sm font-medium text-white/70">
            <Flame className="me-1 h-4 w-4 text-orange-300" />
            {t("popular")}
          </span>
          {QUICK_PICKS.map(({ key, patch }) => (
            <button
              key={key}
              type="button"
              onClick={() => onQuickPick(patch)}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-normal text-white backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              {t(key, { price: fmt.price(BUDGET_MAX_EGP) })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarsHero;
