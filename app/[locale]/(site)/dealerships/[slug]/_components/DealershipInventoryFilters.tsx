"use client";

import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatPrice, buildActiveChips } from "./inventory-filters/filter-utils";
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

    const activeChips = buildActiveChips(filters, availableFilters);

    const bodyTypes = availableFilters?.bodyTypes || [];
    const fuelTypes = availableFilters?.fuelTypes || [];
    const transmissions = availableFilters?.transmissions || [];
    const maxPriceLimit = availableFilters?.priceRange?.max || 100000;

    return (
        <div className="space-y-4 mb-6">
            {/* Row 1: Header + Sort */}
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-baseline gap-2">
                    Available Cars
                    <span className="text-muted-foreground font-normal text-sm">
                        ({totalCars} matching)
                    </span>
                </h3>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:inline-block">Sort by</span>
                    <Select value={filters.sortBy || "newest"} onValueChange={handleSortChange}>
                        <SelectTrigger className="h-9 w-[160px] bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary focus:border-primary">
                            <SelectValue placeholder="Sort order" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-100 shadow-lg rounded-xl">
                            <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                            <SelectItem value="priceAsc" className="text-xs">Price: Low to High</SelectItem>
                            <SelectItem value="priceDesc" className="text-xs">Price: High to Low</SelectItem>
                            <SelectItem value="year" className="text-xs">Year: Newest</SelectItem>
                            <SelectItem value="mileage" className="text-xs">Mileage: Lowest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Row 2: Search + Inline Popovers (Desktop) & Trigger Button (Mobile) */}
            <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search make, model..."
                        value={searchVal}
                        onChange={handleSearchChange}
                        className="ps-9 pe-9 h-9.5 w-full bg-white border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                    {searchVal && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Mobile Filter Button */}
                <div className="md:hidden">
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="h-9.5 gap-2 px-3 border-slate-200 rounded-lg bg-white text-slate-700 font-medium hover:bg-slate-50">
                                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">Filters</span>
                                {activeChips.length > 0 && (
                                    <Badge className="ms-1 h-5 min-w-5 px-1.5 bg-primary text-white text-micro rounded-full flex items-center justify-center">
                                        {activeChips.length}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-0 flex flex-col bg-white">
                            <SheetHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                                <SheetTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                                    Filter Inventory
                                </SheetTitle>
                                <SheetClose className="rounded-full p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                                    <X className="h-4 w-4" />
                                </SheetClose>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {/* Price Slider */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Price Range</h4>
                                    <div className="flex justify-between items-center gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <span className="text-xs font-semibold text-slate-700">{formatPrice(priceVal[0])}</span>
                                        <span className="text-micro font-bold text-slate-400">to</span>
                                        <span className="text-xs font-semibold text-slate-700">{formatPrice(priceVal[1])}</span>
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

                                <FilterCheckboxGroup label="Body Type" field="bodyType" options={bodyTypes} selectedCsv={filters.bodyType} onToggle={handleCheckboxToggle} />
                                <FilterCheckboxGroup label="Fuel Type" field="fuelType" options={fuelTypes} selectedCsv={filters.fuelType} onToggle={handleCheckboxToggle} />
                                <FilterCheckboxGroup label="Transmission" field="transmission" options={transmissions} selectedCsv={filters.transmission} onToggle={handleCheckboxToggle} />
                            </div>

                            <SheetFooter className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-row gap-3">
                                {activeChips.length > 0 && (
                                    <Button variant="outline" onClick={handleClearAll} className="flex-1 rounded-xl h-11 border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-colors">
                                        Reset All
                                    </Button>
                                )}
                                <Button onClick={() => setIsMobileOpen(false)} className="flex-1 rounded-xl h-11 bg-primary text-white font-semibold text-xs shadow-md shadow-primary/10 hover:bg-primary/95 transition-colors">
                                    Show {totalCars} Cars
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Popover Filters (Desktop) */}
                <div className="hidden md:flex items-center gap-2">
                    {bodyTypes.length > 0 && (
                        <FilterCheckboxPopover label="Body Type" field="bodyType" options={bodyTypes} selectedCsv={filters.bodyType} onToggle={handleCheckboxToggle} idPrefix="body" contentWidthClass="w-[200px]" />
                    )}
                    {fuelTypes.length > 0 && (
                        <FilterCheckboxPopover label="Fuel Type" field="fuelType" options={fuelTypes} selectedCsv={filters.fuelType} onToggle={handleCheckboxToggle} idPrefix="fuel" contentWidthClass="w-[200px]" />
                    )}

                    {/* Price Range Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`h-9.5 gap-1.5 px-3 rounded-lg bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all ${(filters.minPrice || filters.maxPrice) ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10' : ''}`}>
                                <span className="text-xs">Price Range</span>
                                {(filters.minPrice || filters.maxPrice) && (
                                    <Badge variant="secondary" className="h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/15 font-bold text-micro rounded-full">
                                        Set
                                    </Badge>
                                )}
                                <ChevronDown className="h-3 w-3 opacity-60 ms-0.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[280px] p-4 rounded-xl border border-slate-100 shadow-xl bg-white space-y-4">
                            <div className="flex justify-between items-center gap-2">
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex-1 text-center">
                                    <p className="text-micro font-bold text-slate-400 uppercase tracking-wide">Min Price</p>
                                    <span className="text-xs font-bold text-slate-700">{formatPrice(priceVal[0])}</span>
                                </div>
                                <span className="text-slate-300">-</span>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex-1 text-center">
                                    <p className="text-micro font-bold text-slate-400 uppercase tracking-wide">Max Price</p>
                                    <span className="text-xs font-bold text-slate-700">{formatPrice(priceVal[1])}</span>
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
                        <FilterCheckboxPopover label="Transmission" field="transmission" options={transmissions} selectedCsv={filters.transmission} onToggle={handleCheckboxToggle} idPrefix="trans" contentWidthClass="w-[180px]" />
                    )}
                </div>
            </div>

            {/* Row 3: Active Filter Chips */}
            <ActiveFilterChips chips={activeChips} onRemove={handleRemoveChip} onClearAll={handleClearAll} />
        </div>
    );
};
