"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { usePlaceNames } from "@/hooks/use-place-names";
import type {
    DealershipActiveFilter,
    DealershipFilterOptions,
    DealershipFilters,
    DealershipHandlers,
} from "../_lib/dealership-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    FilterPopover,
    ChipGroup,
    ActiveFilterChips,
} from "@/components/common/FilterBar";
import {
    DEALERSHIP_PER_PAGE_OPTIONS,
    DEFAULT_DEALERSHIP_SORT,
    DEALERSHIP_SORT_ORDER,
} from "@/lib/constants/dealership-options";

export const DealershipFilterBar = ({
    totalCount,
    filters,
    filterOptions,
    perPage,
    activeFilters,
    onToggleFilter,
    onSortChange,
    onPerPageChange,
    onClearFilter,
    onResetAll,
}: {
    totalCount: number;
    filters: DealershipFilters;
    filterOptions: DealershipFilterOptions;
    perPage: number;
    activeFilters: DealershipActiveFilter[];
    onToggleFilter: DealershipHandlers["toggleFilter"];
    onSortChange: DealershipHandlers["setSort"];
    onPerPageChange: DealershipHandlers["changePerPage"];
    onClearFilter: DealershipHandlers["clearFilter"];
    onResetAll: DealershipHandlers["resetAllFilters"];
}) => {
    const t = useTranslations("dealerships.filters");
    const tSort = useTranslations("dealerships.sort");
    const fmt = useFormatters();
    const place = usePlaceNames();
    const [sheetOpen, setSheetOpen] = useState(false);

    // The facet query groups by a nullable column, so organizations with no
    // city/region come back as a `value: null` bucket. Rendering it produced a
    // blank, unselectable chip.
    const withoutNullValues = (
        options: { value: string | null; count: number }[] | undefined,
        label: (value: string) => string
    ) =>
        (options ?? []).flatMap((option) =>
            option.value === null
                ? []
                : [{ value: option.value, label: label(option.value), count: option.count }]
        );
    const cities = withoutNullValues(filterOptions?.cities, place.city);
    const regions = withoutNullValues(filterOptions?.regions, place.region);
    const sortValue = filters.sort || DEFAULT_DEALERSHIP_SORT;

    const activeCount = activeFilters.length;

    // The facet controls, reused between the desktop popovers and the mobile sheet.
    const cityControl = (
        <ChipGroup
            options={cities}
            selectedValues={filters.city ? [filters.city] : []}
            onToggle={(v) => onToggleFilter("city", v)}
            searchPlaceholder={t("searchCities")}
            emptyLabel={t("noCities")}
        />
    );
    const regionControl = (
        <ChipGroup
            options={regions}
            selectedValues={filters.region ? [filters.region] : []}
            onToggle={(v) => onToggleFilter("region", v)}
            searchPlaceholder={t("searchRegions")}
            emptyLabel={t("noRegions")}
        />
    );
    return (
        <div className="mb-6 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Result count */}
                {/* One message, not a count plus a hand-pluralised noun: Arabic
                    inflects the noun against six forms, and the bold span
                    around the number cannot survive that. */}
                <p
                    className="text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                >
                    {t("resultCount", {
                        count: totalCount,
                        value: fmt.number(totalCount),
                    })}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Desktop popovers */}
                    <div className="hidden items-center gap-2 md:flex">
                        <FilterPopover
                            label={t("city")}
                            activeCount={filters.city ? 1 : 0}
                            activeLabel={place.city(filters.city)}
                        >
                            {cityControl}
                        </FilterPopover>
                        <FilterPopover
                            label={t("region")}
                            activeCount={filters.region ? 1 : 0}
                            activeLabel={place.region(filters.region)}
                        >
                            {regionControl}
                        </FilterPopover>
                    </div>

                    {/* Mobile: single Filters button → bottom sheet */}
                    <div className="md:hidden">
                        <Button
                            variant="outline"
                            className="h-9 gap-2 px-3 text-xs font-medium"
                            onClick={() => setSheetOpen(true)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {t("filters")}
                            {activeCount > 0 && (
                                <Badge className="h-5 min-w-5 justify-center rounded-full bg-primary px-1.5 text-micro text-primary-foreground">
                                    {fmt.number(activeCount)}
                                </Badge>
                            )}
                        </Button>
                    </div>

                    {/* Per-page (desktop only) */}
                    <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))}>
                        <SelectTrigger
                            className="hidden h-9 w-[110px] text-sm sm:flex"
                            aria-label={t("perPageLabel")}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DEALERSHIP_PER_PAGE_OPTIONS.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {t("perPage", { count: fmt.number(n) })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sortValue} onValueChange={onSortChange}>
                        <SelectTrigger className="h-9 flex-1 text-sm sm:w-[180px] sm:flex-none" aria-label={t("sortLabel")}>
                            <SelectValue placeholder={t("sortPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            {DEALERSHIP_SORT_ORDER.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {tSort(value)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <ActiveFilterChips filters={activeFilters} onClear={onClearFilter} />

            {/* Mobile filter sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="bottom" className="flex max-h-[85vh] flex-col p-0">
                    <SheetHeader className="border-b border-border px-5 py-4">
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <SlidersHorizontal className="h-4 w-4 text-primary" />
                            {t("sheetTitle")}
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                        <FilterSheetSection title={t("city")}>{cityControl}</FilterSheetSection>
                        <FilterSheetSection title={t("region")}>{regionControl}</FilterSheetSection>
                    </div>

                    <SheetFooter className="flex flex-row gap-3 border-t border-border bg-muted/30 p-4">
                        {activeCount > 0 && (
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    onResetAll();
                                }}
                            >
                                {t("resetAll")}
                            </Button>
                        )}
                        <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                            {t("showResults", {
                                count: totalCount,
                                value: fmt.number(totalCount),
                            })}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

const FilterSheetSection = ({
    title,
    children,
}: {
    title: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
        </h4>
        {children}
    </div>
);

export default DealershipFilterBar;
