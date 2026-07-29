"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
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
    DEALERSHIP_SORT_LABELS,
} from "@/lib/constants/dealership-options";

// Static — the sort options never change, so they render synchronously on the
// server/first paint instead of waiting for the client filter-options fetch
// (which would otherwise leave the sort label blank for a moment on load).
const SORT_OPTIONS = DEALERSHIP_SORT_ORDER.map((value) => ({
    value,
    label: DEALERSHIP_SORT_LABELS[value],
}));

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
}) => {
    const [sheetOpen, setSheetOpen] = useState(false);

    const cities = filterOptions?.cities || [];
    const regions = filterOptions?.regions || [];
    const sortValue = filters.sort || DEFAULT_DEALERSHIP_SORT;

    const activeCount = activeFilters.length;

    // The facet controls, reused between the desktop popovers and the mobile sheet.
    const cityControl = (
        <ChipGroup
            options={cities}
            selectedValues={filters.city ? [filters.city] : []}
            onToggle={(v) => onToggleFilter("city", v)}
            searchPlaceholder="Search cities..."
            emptyLabel="No cities available"
        />
    );
    const regionControl = (
        <ChipGroup
            options={regions}
            selectedValues={filters.region ? [filters.region] : []}
            onToggle={(v) => onToggleFilter("region", v)}
            searchPlaceholder="Search regions..."
            emptyLabel="No regions available"
        />
    );
    return (
        <div className="mb-6 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Result count */}
                <p
                    className="text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                >
                    <span className="font-medium text-foreground">
                        {totalCount.toLocaleString()}
                    </span>{" "}
                    {totalCount === 1 ? "dealership" : "dealerships"} found
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Desktop popovers */}
                    <div className="hidden items-center gap-2 md:flex">
                        <FilterPopover
                            label="City"
                            activeCount={filters.city ? 1 : 0}
                            activeLabel={filters.city}
                        >
                            {cityControl}
                        </FilterPopover>
                        <FilterPopover
                            label="Region"
                            activeCount={filters.region ? 1 : 0}
                            activeLabel={filters.region}
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
                            Filters
                            {activeCount > 0 && (
                                <Badge className="h-5 min-w-5 justify-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                                    {activeCount}
                                </Badge>
                            )}
                        </Button>
                    </div>

                    {/* Per-page (desktop only) */}
                    <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))}>
                        <SelectTrigger
                            className="hidden h-9 w-[110px] text-sm sm:flex"
                            aria-label="Results per page"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DEALERSHIP_PER_PAGE_OPTIONS.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n} / page
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sortValue} onValueChange={onSortChange}>
                        <SelectTrigger className="h-9 flex-1 text-sm sm:w-[180px] sm:flex-none" aria-label="Sort results">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
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
                            Filter dealerships
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                        <FilterSheetSection title="City">{cityControl}</FilterSheetSection>
                        <FilterSheetSection title="Region">{regionControl}</FilterSheetSection>
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
                                Reset all
                            </Button>
                        )}
                        <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                            Show {totalCount.toLocaleString()}{" "}
                            {totalCount === 1 ? "dealership" : "dealerships"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

const FilterSheetSection = ({ title, children }) => (
    <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
        </h4>
        {children}
    </div>
);

export default DealershipFilterBar;
