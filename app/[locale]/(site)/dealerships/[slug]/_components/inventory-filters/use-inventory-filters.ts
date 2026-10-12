import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { buildActiveChips } from "./filter-utils";
import type { DealershipInventoryFilterState, DealershipInventoryProps } from "../../_lib/detail-types";

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

/** The inventory filters' local state (search text, price slider, sheet) and how each control changes the filters. */
export function useInventoryFilters({
    filters,
    onFilterChange,
    availableFilters,
}: Pick<DealershipInventoryProps, "filters" | "onFilterChange" | "availableFilters">) {
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

    return {
        searchVal,
        priceVal,
        isMobileOpen,
        setIsMobileOpen,
        handleSearchChange,
        handleClearSearch,
        handleCheckboxToggle,
        handlePriceChange,
        handlePriceCommit,
        handleSortChange,
        handleClearAll,
        handleRemoveChip,
        activeChips,
        bodyTypes,
        fuelTypes,
        transmissions,
        maxPriceLimit,
    };
}
