"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";

const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(price);
};

export const DealershipInventoryFilters = ({
    filters,
    onFilterChange,
    availableFilters,
    totalCars,
    isLoading
}) => {
    const [searchVal, setSearchVal] = useState(filters.search || "");
    const [priceVal, setPriceVal] = useState([
        filters.minPrice || 0,
        filters.maxPrice || (availableFilters?.priceRange?.max || 100000)
    ]);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const searchDebounceRef = useRef(null);

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

    const handleSearchChange = (e) => {
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

    const handleCheckboxToggle = (field, value) => {
        const currentVals = filters[field] ? filters[field].split(",") : [];
        let newVals;
        if (currentVals.includes(value)) {
            newVals = currentVals.filter((v) => v !== value);
        } else {
            newVals = [...currentVals, value];
        }
        onFilterChange({
            ...filters,
            [field]: newVals.length > 0 ? newVals.join(",") : undefined
        });
    };

    const handlePriceChange = (val) => {
        setPriceVal(val);
    };

    const handlePriceCommit = (val) => {
        const maxLimit = availableFilters?.priceRange?.max || 100000;
        const isMinSet = val[0] > 0;
        const isMaxSet = val[1] < maxLimit;

        onFilterChange({
            ...filters,
            minPrice: isMinSet ? val[0] : undefined,
            maxPrice: isMaxSet ? val[1] : undefined
        });
    };

    const handleSortChange = (val) => {
        onFilterChange({ ...filters, sortBy: val });
    };

    const handleClearAll = () => {
        onFilterChange({
            sortBy: "newest"
        });
        setSearchVal("");
        setPriceVal([0, availableFilters?.priceRange?.max || 100000]);
    };

    const handleRemoveChip = (field, value) => {
        if (field === "search") {
            handleClearSearch();
        } else if (field === "price") {
            onFilterChange({
                ...filters,
                minPrice: undefined,
                maxPrice: undefined
            });
        } else {
            const currentVals = filters[field] ? filters[field].split(",") : [];
            const newVals = currentVals.filter((v) => v !== value);
            onFilterChange({
                ...filters,
                [field]: newVals.length > 0 ? newVals.join(",") : undefined
            });
        }
    };

    // Calculate active filters counts and list for chips
    const activeChips = [];
    if (filters.search) {
        activeChips.push({ type: "search", label: `Search: "${filters.search}"`, field: "search" });
    }
    if (filters.minPrice || filters.maxPrice) {
        const minStr = filters.minPrice ? formatPrice(filters.minPrice) : "$0";
        const maxStr = filters.maxPrice ? formatPrice(filters.maxPrice) : formatPrice(availableFilters?.priceRange?.max || 100000);
        activeChips.push({ type: "price", label: `Price: ${minStr} - ${maxStr}`, field: "price" });
    }
    ["bodyType", "fuelType", "transmission"].forEach((field) => {
        if (filters[field]) {
            filters[field].split(",").forEach((val) => {
                activeChips.push({ type: field, label: val, field, value: val });
            });
        }
    });

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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search make, model..."
                        value={searchVal}
                        onChange={handleSearchChange}
                        className="pl-9 pr-9 h-9.5 w-full bg-white border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                    {searchVal && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                                    <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
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
                                        <span className="text-[10px] font-bold text-slate-400">to</span>
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

                                {/* Body Type Options */}
                                {bodyTypes.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Body Type</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {bodyTypes.map((type) => {
                                                const isChecked = (filters.bodyType || "").split(",").includes(type);
                                                return (
                                                    <label key={type} className={`flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 cursor-pointer transition-colors ${isChecked ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white hover:bg-slate-50 text-slate-700'}`}>
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => handleCheckboxToggle("bodyType", type)}
                                                        />
                                                        <span className="text-xs font-semibold truncate">{type}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Fuel Type Options */}
                                {fuelTypes.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fuel Type</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {fuelTypes.map((fuel) => {
                                                const isChecked = (filters.fuelType || "").split(",").includes(fuel);
                                                return (
                                                    <label key={fuel} className={`flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 cursor-pointer transition-colors ${isChecked ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white hover:bg-slate-50 text-slate-700'}`}>
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => handleCheckboxToggle("fuelType", fuel)}
                                                        />
                                                        <span className="text-xs font-semibold truncate">{fuel}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Transmission Options */}
                                {transmissions.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transmission</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {transmissions.map((trans) => {
                                                const isChecked = (filters.transmission || "").split(",").includes(trans);
                                                return (
                                                    <label key={trans} className={`flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 cursor-pointer transition-colors ${isChecked ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white hover:bg-slate-50 text-slate-700'}`}>
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => handleCheckboxToggle("transmission", trans)}
                                                        />
                                                        <span className="text-xs font-semibold truncate">{trans}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
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
                    {/* Body Type Popover */}
                    {bodyTypes.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={`h-9.5 gap-1.5 px-3 rounded-lg bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all ${filters.bodyType ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10' : ''}`}>
                                    <span className="text-xs">Body Type</span>
                                    {filters.bodyType && (
                                        <Badge variant="secondary" className="h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/15 font-bold text-[10px] rounded-full">
                                            {filters.bodyType.split(",").length}
                                        </Badge>
                                    )}
                                    <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-[200px] p-3 rounded-xl border border-slate-100 shadow-xl bg-white space-y-2">
                                {bodyTypes.map((type) => {
                                    const isChecked = (filters.bodyType || "").split(",").includes(type);
                                    return (
                                        <div key={type} className="flex items-center gap-2.5 px-1 py-1">
                                            <Checkbox
                                                id={`body-${type}`}
                                                checked={isChecked}
                                                onCheckedChange={() => handleCheckboxToggle("bodyType", type)}
                                            />
                                            <label htmlFor={`body-${type}`} className="text-xs font-semibold text-slate-700 cursor-pointer select-none truncate">
                                                {type}
                                            </label>
                                        </div>
                                    );
                                })}
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* Fuel Type Popover */}
                    {fuelTypes.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={`h-9.5 gap-1.5 px-3 rounded-lg bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all ${filters.fuelType ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10' : ''}`}>
                                    <span className="text-xs">Fuel Type</span>
                                    {filters.fuelType && (
                                        <Badge variant="secondary" className="h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/15 font-bold text-[10px] rounded-full">
                                            {filters.fuelType.split(",").length}
                                        </Badge>
                                    )}
                                    <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-[200px] p-3 rounded-xl border border-slate-100 shadow-xl bg-white space-y-2">
                                {fuelTypes.map((fuel) => {
                                    const isChecked = (filters.fuelType || "").split(",").includes(fuel);
                                    return (
                                        <div key={fuel} className="flex items-center gap-2.5 px-1 py-1">
                                            <Checkbox
                                                id={`fuel-${fuel}`}
                                                checked={isChecked}
                                                onCheckedChange={() => handleCheckboxToggle("fuelType", fuel)}
                                            />
                                            <label htmlFor={`fuel-${fuel}`} className="text-xs font-semibold text-slate-700 cursor-pointer select-none truncate">
                                                {fuel}
                                            </label>
                                        </div>
                                    );
                                })}
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* Price Range Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`h-9.5 gap-1.5 px-3 rounded-lg bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all ${(filters.minPrice || filters.maxPrice) ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10' : ''}`}>
                                <span className="text-xs">Price Range</span>
                                {(filters.minPrice || filters.maxPrice) && (
                                    <Badge variant="secondary" className="h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/15 font-bold text-[10px] rounded-full">
                                        Set
                                    </Badge>
                                )}
                                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[280px] p-4 rounded-xl border border-slate-100 shadow-xl bg-white space-y-4">
                            <div className="flex justify-between items-center gap-2">
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex-1 text-center">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Min Price</p>
                                    <span className="text-xs font-bold text-slate-700">{formatPrice(priceVal[0])}</span>
                                </div>
                                <span className="text-slate-300">-</span>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex-1 text-center">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Max Price</p>
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

                    {/* Transmission Popover */}
                    {transmissions.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={`h-9.5 gap-1.5 px-3 rounded-lg bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all ${filters.transmission ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10' : ''}`}>
                                    <span className="text-xs">Transmission</span>
                                    {filters.transmission && (
                                        <Badge variant="secondary" className="h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/15 font-bold text-[10px] rounded-full">
                                            {filters.transmission.split(",").length}
                                        </Badge>
                                    )}
                                    <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-[180px] p-3 rounded-xl border border-slate-100 shadow-xl bg-white space-y-2">
                                {transmissions.map((trans) => {
                                    const isChecked = (filters.transmission || "").split(",").includes(trans);
                                    return (
                                        <div key={trans} className="flex items-center gap-2.5 px-1 py-1">
                                            <Checkbox
                                                id={`trans-${trans}`}
                                                checked={isChecked}
                                                onCheckedChange={() => handleCheckboxToggle("transmission", trans)}
                                            />
                                            <label htmlFor={`trans-${trans}`} className="text-xs font-semibold text-slate-700 cursor-pointer select-none truncate">
                                                {trans}
                                            </label>
                                        </div>
                                    );
                                })}
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            {/* Row 3: Active Filter Chips */}
            <AnimatePresence>
                {activeChips.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex flex-wrap items-center gap-1.5 pt-1"
                    >
                        {activeChips.map((chip, idx) => (
                            <motion.div
                                key={`${chip.field}-${chip.value || idx}`}
                                layout
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.85, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Badge variant="outline" className="flex items-center gap-1 py-1 pl-2.5 pr-1.5 bg-slate-50 border-slate-200 text-slate-600 rounded-full font-medium text-[11px] select-none hover:bg-slate-100 transition-colors">
                                    <span>{chip.label}</span>
                                    <button
                                        onClick={() => handleRemoveChip(chip.field, chip.value)}
                                        className="h-4 w-4 bg-slate-200/60 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                                    >
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            </motion.div>
                        ))}

                        <Button
                            variant="ghost"
                            onClick={handleClearAll}
                            className="h-7 gap-1.5 px-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all font-semibold text-[11px] cursor-pointer"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Clear All
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
