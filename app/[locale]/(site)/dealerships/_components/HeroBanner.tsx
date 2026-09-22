"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Input } from "@/components/ui/input";

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
    // their own. toLocaleString() with no locale also gave Western digits.
    const subtitle = !dealerships
        ? t("subtitleFallback")
        : cities
          ? t("subtitleWithCities", {
                count: dealerships,
                value: fmt.number(dealerships),
                cityCount: cities,
                cityValue: fmt.number(cities),
            })
          : t("subtitle", {
                count: dealerships,
                value: fmt.number(dealerships),
            });

    return (
        <div className="animated-gradient relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-brand-accent px-6 py-8 shadow-lg sm:px-10 sm:py-10">
            {/* Decorative floating accents */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="animate-float absolute -end-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="animate-float-delayed absolute -bottom-16 -start-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
                    {t("title")}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-white/80 sm:text-base">
                    {subtitle}
                </p>

                {/* Search */}
                <div className="group relative mx-auto mt-6 max-w-xl">
                    <Search className="absolute start-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <Input
                        type="text"
                        placeholder={t("searchPlaceholder")}
                        value={searchQuery || ""}
                        onChange={(e) => onSearchChange(e.target.value)}
                        aria-label={t("searchLabel")}
                        className="h-14 w-full rounded-xl border border-white/40 bg-white/95 ps-12 pe-12 text-base text-gray-900 shadow-lg placeholder:text-gray-500 focus-visible:border-white focus-visible:ring-4 focus-visible:ring-white/20"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute end-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                            aria-label={tCommon("actions.clearSearch")}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroBanner;
