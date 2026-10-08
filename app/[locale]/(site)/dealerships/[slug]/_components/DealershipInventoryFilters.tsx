"use client";

import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { buildActiveChips, FILTER_CHIP, FILTER_CHIP_ACTIVE } from "./inventory-filters/filter-utils";
import FilterCheckboxPopover from "./inventory-filters/FilterCheckboxPopover";
import FilterCheckboxGroup from "./inventory-filters/FilterCheckboxGroup";
import ActiveFilterChips from "./inventory-filters/ActiveFilterChips";
import type {
    DealershipInventoryFilterState,
    DealershipInventoryProps,
} from "../_lib/detail-types";

/**
 * The multi-select facets are stored as comma-separated strings, and the chip
 * and checkbox handlers address them by name at runtime. Reading them through
 * this keeps that dynamic access in one narrow place.
 */
const readCsvFilter = (
    filters: DealershipInventoryFilterState,
    field: string
): string[] => {
    const value = filters[field as keyof DealershipInventoryFilterState];
    return typeof value === "string" && value ? value.split(",") : [];
};

export const DealershipInventoryFilters = ({
    filters,
    onFilterChange,
    availableFilters,
    totalCars,
    isLoading
}: Pick<
    DealershipInventoryProps,
    "filters" | "onFilterChange" | "availableFilters"
> & {
    totalCars?: number;
    isLoading?: boolean;
}) => {
    const t = useTranslations("dealerships.inventory");
    const fmt = useFormatters();
    const attr = useCarAttributes();
    const [searchVal, setSearchVal] = useState(filters.search || "");
    const [priceVal, setPriceVal] = useState<number[]>([
        Number(filters.minPrice) || 0,
        Number(filters.maxPrice) || (availableFilters?.priceRange?.max || 100000)
    ]);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync search val with filters prop
    useEffect(() => {
        setSearchVal(filters.search || "");
    }, [filters.search]);

    // Sync price range defaults
    useEffect(() => {
        setPriceVal([
            filters.minPrice || 0,
            filters.maxPrice || (availableFilters?.priceRange?.max || 100000)
        ]);
    }, [filters.minPrice, filters.maxPrice, availableFilters?.priceRange?.max]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchVal(val);

        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            onFilterChange({ ...filters, search: val || undefined });
        }, 400);
    };

    const handleClearSearch = () => {
        setSearchVal("");
        onFilterChange({ ...filters, search: undefined });
    };

    const handleCheckboxToggle = (field: string, value: string) => {
        const currentVals = readCsvFilter(filters, field);
        let newVals: string[];
        if (currentVals.includes(value)) {
            newVals = currentVals.filter((v: string) => v !== value);
        } else {
            newVals = [...currentVals, value];
        }
        onFilterChange({
            ...filters,
            [field]: newVals.length > 0 ? newVals.join(",") : undefined
        });
    };

    const handlePriceChange = (val: number[]) => {
        setPriceVal(val);
    };

    const handlePriceCommit = (val: number[]) => {
        const maxLimit = availableFilters?.priceRange?.max || 100000;
        const isMinSet = val[0] > 0;
        const isMaxSet = val[1] < maxLimit;

        onFilterChange({
            ...filters,
            minPrice: isMinSet ? val[0] : undefined,
            maxPrice: isMaxSet ? val[1] : undefined
        });
    };

    const handleSortChange = (val: string) => {
        onFilterChange({ ...filters, sortBy: val });
    };

    const handleClearAll = () => {
        onFilterChange({
            sortBy: "newest"
        });
        setSearchVal("");
        setPriceVal([0, availableFilters?.priceRange?.max || 100000]);
    };

    const handleRemoveChip = (field: string, value?: string) => {
        if (field === "search") {
            handleClearSearch();
        } else if (field === "price") {
            onFilterChange({
                ...filters,
                minPrice: undefined,
                maxPrice: undefined
            });
        } else {
            const currentVals = readCsvFilter(filters, field);
            const newVals = currentVals.filter((v) => v !== value);
            onFilterChange({
                ...filters,
                [field]: newVals.length > 0 ? newVals.join(",") : undefined
            });
        }
    };

    const activeChips = buildActiveChips(filters, availableFilters, {
        formatPrice: fmt.price,
        search: (query) => t("chips.search", { query }),
        priceRange: (min, max) => t("chips.price", { min, max }),
        attribute: (field, value) =>
            field === "bodyType"
                ? attr.body(value)
                : field === "fuelType"
                  ? attr.fuel(value)
                  : attr.transmission(value),
    });

    const bodyTypes = availableFilters?.bodyTypes || [];
    const fuelTypes = availableFilters?.fuelTypes || [];
    const transmissions = availableFilters?.transmissions || [];
    const maxPriceLimit = availableFilters?.priceRange?.max || 100000;

    return (
        <div className="flex flex-col gap-4">
            {/* Row 1: search, then the filters — popovers on desktop, a sheet on phones */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-0 flex-1 md:min-w-[16rem]">
                    <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={t("searchPlaceholder")}
                        aria-label={t("searchPlaceholder")}
                        value={searchVal}
                        onChange={handleSearchChange}
                        className="h-12 w-full rounded-control border-border bg-field ps-12 pe-12 text-body placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
                    />
                    {searchVal && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            aria-label={t("clearSearch")}
                            className="absolute end-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-plate text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>

                {/* Mobile Filter Button */}
                <div className="md:hidden">
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="h-12 gap-2 rounded-control border-border bg-field px-4 font-semibold hover:bg-field hover:border-border-strong">
                                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{t("filters")}</span>
                                {activeChips.length > 0 && (
                                    <Badge className="ms-1 h-5 min-w-5 px-1.5 bg-primary text-white text-micro rounded-full flex items-center justify-center">
                                        {fmt.number(activeChips.length)}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-0 flex flex-col bg-card">
                            <SheetHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
                                <SheetTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                                    {t("sheetTitle")}
                                </SheetTitle>
                                <SheetClose className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-muted-foreground">
                                    <X className="h-4 w-4" />
                                </SheetClose>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {/* Price Slider */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("priceRange")}</h4>
                                    <div className="flex justify-between items-center gap-4 bg-muted p-2.5 rounded-lg border border-border">
                                        <span className="text-xs font-semibold text-muted-foreground">{fmt.price(priceVal[0])}</span>
                                        <span className="text-micro font-bold text-muted-foreground">{t("to")}</span>
                                        <span className="text-xs font-semibold text-muted-foreground">{fmt.price(priceVal[1])}</span>
                                    </div>
                                    <div className="px-2 pt-2">
                                        <Slider
                                            min={0}
                                            max={maxPriceLimit || 100000}
                                            step={1000}
                                            value={priceVal}
                                            onValueChange={handlePriceChange}
                                            onValueCommit={handlePriceCommit}
                                        />
                                    </div>
                                </div>

                                <FilterCheckboxGroup label={t("bodyType")} field="bodyType" options={bodyTypes} selectedCsv={filters.bodyType} onToggle={handleCheckboxToggle} />
                                <FilterCheckboxGroup label={t("fuelType")} field="fuelType" options={fuelTypes} selectedCsv={filters.fuelType} onToggle={handleCheckboxToggle} />
                                <FilterCheckboxGroup label={t("transmission")} field="transmission" options={transmissions} selectedCsv={filters.transmission} onToggle={handleCheckboxToggle} />
                            </div>

                            <SheetFooter className="p-4 border-t border-border bg-muted/50 flex flex-row gap-3">
                                {activeChips.length > 0 && (
                                    <Button variant="outline" onClick={handleClearAll} className="flex-1 rounded-control h-11 border-border hover:bg-muted text-muted-foreground font-semibold text-xs transition-colors">
                                        {t("resetAll")}
                                    </Button>
                                )}
                                <Button onClick={() => setIsMobileOpen(false)} className="flex-1 rounded-control h-11 bg-primary text-white font-semibold text-xs shadow-primary/10 hover:bg-primary/95 transition-colors">
                                    {t("showCars", {
                                        count: totalCars ?? 0,
                                        value: fmt.number(totalCars ?? 0),
                                    })}
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Popover Filters (Desktop) */}
                <div className="hidden md:flex items-center gap-2">
                    {bodyTypes.length > 0 && (
                        <FilterCheckboxPopover label={t("bodyType")} field="bodyType" options={bodyTypes} selectedCsv={filters.bodyType} onToggle={handleCheckboxToggle} idPrefix="body" contentWidthClass="w-[200px]" />
                    )}
                    {fuelTypes.length > 0 && (
                        <FilterCheckboxPopover label={t("fuelType")} field="fuelType" options={fuelTypes} selectedCsv={filters.fuelType} onToggle={handleCheckboxToggle} idPrefix="fuel" contentWidthClass="w-[200px]" />
                    )}

                    {/* Price Range Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`${FILTER_CHIP} ${(filters.minPrice || filters.maxPrice) ? FILTER_CHIP_ACTIVE : ""}`}>
                                <span>{t("priceRange")}</span>
                                {(filters.minPrice || filters.maxPrice) && (
                                    <Badge variant="secondary" className="h-5 px-1.5 bg-inverse-foreground text-inverse hover:bg-inverse-foreground font-bold text-micro rounded-full">
                                        {t("set")}
                                    </Badge>
                                )}
                                <ChevronDown className="h-3 w-3 opacity-60 ms-0.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[280px] p-4 rounded-control border border-border bg-card space-y-4">
                            <div className="flex justify-between items-center gap-2">
                                <div className="bg-muted p-2 rounded-lg border border-border flex-1 text-center">
                                    <p className="text-micro font-bold text-muted-foreground uppercase tracking-wide">{t("minPrice")}</p>
                                    <span className="text-xs font-bold text-muted-foreground">{fmt.price(priceVal[0])}</span>
                                </div>
                                <span className="text-muted-foreground/60">-</span>
                                <div className="bg-muted p-2 rounded-lg border border-border flex-1 text-center">
                                    <p className="text-micro font-bold text-muted-foreground uppercase tracking-wide">{t("maxPrice")}</p>
                                    <span className="text-xs font-bold text-muted-foreground">{fmt.price(priceVal[1])}</span>
                                </div>
                            </div>
                            <div className="px-1.5 pt-1.5 pb-2">
                                <Slider
                                    min={0}
                                    max={maxPriceLimit || 100000}
                                    step={1000}
                                    value={priceVal}
                                    onValueChange={handlePriceChange}
                                    onValueCommit={handlePriceCommit}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>

                    {transmissions.length > 0 && (
                        <FilterCheckboxPopover label={t("transmission")} field="transmission" options={transmissions} selectedCsv={filters.transmission} onToggle={handleCheckboxToggle} idPrefix="trans" contentWidthClass="w-[180px]" />
                    )}
                </div>
            </div>

            {/* Row 2: how many, and the order — the Browse page's count line */}
            <div className="flex items-center justify-between gap-4">
                <p role="status" aria-live="polite" className="text-h3 font-semibold max-sm:text-body">
                    {t("count", { count: totalCars ?? 0, value: fmt.number(totalCars ?? 0) })}
                </p>
                <Select value={filters.sortBy || "newest"} onValueChange={handleSortChange}>
                    <SelectTrigger
                        aria-label={t("sortBy")}
                        className="h-10 w-[11rem] cursor-pointer rounded-control border-border bg-field text-caption font-medium"
                    >
                        <SelectValue placeholder={t("sortPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                        {(["newest", "priceAsc", "priceDesc", "year", "mileage"] as const).map((value) => (
                            <SelectItem key={value} value={value} className="min-h-10 cursor-pointer">
                                {t(`sort.${value}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Row 3: Active Filter Chips */}
            <ActiveFilterChips chips={activeChips} onRemove={handleRemoveChip} onClearAll={handleClearAll} />
        </div>
    );
};
