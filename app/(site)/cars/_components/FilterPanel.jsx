"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import { getCarsFilters } from "@/actions/cars-listing";
import { Separator } from "@/components/ui/separator";
import { Accordion } from "@/components/ui/accordion";
import { useRouter, useSearchParams } from "next/navigation";

import {
  MakesFilter,
  PriceRangeFilter,
  BodyTypeFilter,
  FuelTypeFilter,
  TransmissionFilter,
} from "./filter-components";

const FilterPanel = forwardRef(
  ({ onFilter, isLoading = false, initialFilters = {} }, ref) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const debounceRef = useRef(null);
    const isInitializedRef = useRef(false);

    const [searchQuery, setSearchQuery] = useState(initialFilters.search || "");
    const [selectedMakes, setSelectedMakes] = useState(
      initialFilters.make ? [initialFilters.make] : []
    );
    const [selectedBodyTypes, setSelectedBodyTypes] = useState(
      initialFilters.bodyType ? [initialFilters.bodyType] : []
    );
    const [selectedFuelTypes, setSelectedFuelTypes] = useState(
      initialFilters.fuelType ? [initialFilters.fuelType] : []
    );
    const [selectedTransmissions, setSelectedTransmissions] = useState(
      initialFilters.transmission ? [initialFilters.transmission] : []
    );
    const [priceRange, setPriceRange] = useState([
      initialFilters.minPrice || 0,
      initialFilters.maxPrice || 0,
    ]);
    const [committedPriceRange, setCommittedPriceRange] = useState([
      initialFilters.minPrice || 0,
      initialFilters.maxPrice || 0,
    ]);
    const [maxPriceValue, setMaxPriceValue] = useState(0);
    const [sortBy, setSortBy] = useState(initialFilters.sortBy || "newest");
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);
    const [availableMakes, setAvailableMakes] = useState([]);
    const [availableBodyTypes, setAvailableBodyTypes] = useState([]);
    const [availableFuelTypes, setAvailableFuelTypes] = useState([]);
    const [availableTransmissions, setAvailableTransmissions] = useState([]);

    const {
      data: filtersData,
      loading: filtersLoading,
      fn: fetchFilters,
    } = useFetch(getCarsFilters);

    useImperativeHandle(ref, () => ({
      resetFilters,
    }));

    useEffect(() => {
      if (initialFilters.search !== undefined) setSearchQuery(initialFilters.search || "");
      if (initialFilters.make) setSelectedMakes([initialFilters.make]);
      else setSelectedMakes([]);
      if (initialFilters.bodyType)
        setSelectedBodyTypes([initialFilters.bodyType]);
      else setSelectedBodyTypes([]);
      if (initialFilters.fuelType)
        setSelectedFuelTypes([initialFilters.fuelType]);
      else setSelectedFuelTypes([]);
      if (initialFilters.transmission)
        setSelectedTransmissions([initialFilters.transmission]);
      else setSelectedTransmissions([]);
      if (initialFilters.sortBy) setSortBy(initialFilters.sortBy);

      if (
        (initialFilters.minPrice || initialFilters.maxPrice) &&
        maxPriceValue > 0
      ) {
        const newRange = [
          initialFilters.minPrice || 0,
          initialFilters.maxPrice || maxPriceValue,
        ];
        setPriceRange(newRange);
        setCommittedPriceRange(newRange);
      }
    }, [initialFilters, maxPriceValue]);

    useEffect(() => {
      fetchFilters();
    }, []);

    useEffect(() => {
      if (filtersData?.success && filtersData?.data) {
        const { makes, bodyTypes, fuelTypes, transmissions, priceRange: priceRangeData } =
          filtersData.data;

        setAvailableMakes(makes || []);
        setAvailableBodyTypes(bodyTypes || []);
        setAvailableFuelTypes(fuelTypes || []);
        setAvailableTransmissions(transmissions || []);

        if (priceRangeData?.max) {
          setMaxPriceValue(priceRangeData.max);
          if (priceRange[1] === 0) {
            const newRange = [
              initialFilters.minPrice || 0,
              initialFilters.maxPrice || priceRangeData.max,
            ];
            setPriceRange(newRange);
            setCommittedPriceRange(newRange);
          }
        }
      }
    }, [filtersData, initialFilters]);

    useEffect(() => {
      const count = [
        searchQuery ? 1 : 0,
        selectedMakes.length,
        selectedBodyTypes.length,
        selectedFuelTypes.length,
        selectedTransmissions.length,
        committedPriceRange[0] > 0 ||
          (committedPriceRange[1] < maxPriceValue &&
            committedPriceRange[1] > 0 &&
            maxPriceValue > 0)
          ? 1
          : 0,
      ].reduce((a, b) => a + b, 0);

      setActiveFiltersCount(count);
    }, [
      searchQuery,
      selectedMakes,
      selectedBodyTypes,
      selectedFuelTypes,
      selectedTransmissions,
      committedPriceRange,
      maxPriceValue,
    ]);

    // Auto-apply filters with debounce when filter values change
    useEffect(() => {
      // Skip auto-apply on initial mount
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        applyFilters();
      }, 400);

      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [
      searchQuery,
      selectedMakes,
      selectedBodyTypes,
      selectedFuelTypes,
      selectedTransmissions,
    ]);

    // Price range applies immediately on commit (slider release)
    const handlePriceCommit = useCallback(
      (value) => {
        setCommittedPriceRange(value);
        // Apply immediately on price commit without debounce
        const filters = {
          search: searchQuery || undefined,
          make: selectedMakes.length > 0 ? selectedMakes[0] : undefined,
          bodyType:
            selectedBodyTypes.length > 0 ? selectedBodyTypes[0] : undefined,
          fuelType:
            selectedFuelTypes.length > 0 ? selectedFuelTypes[0] : undefined,
          transmission:
            selectedTransmissions.length > 0
              ? selectedTransmissions[0]
              : undefined,
          minPrice: value[0] > 0 ? value[0] : undefined,
          maxPrice:
            value[1] < maxPriceValue && value[1] > 0
              ? value[1]
              : undefined,
          sortBy: sortBy,
        };

        updateURLWithFilters(filters);
        if (onFilter) onFilter(filters);
      },
      [searchQuery, selectedMakes, selectedBodyTypes, selectedFuelTypes, selectedTransmissions, sortBy, maxPriceValue, onFilter]
    );

    const toggleFilter = (item, selectedItems, setSelectedItems) => {
      if (isLoading) return;
      setSelectedItems((prev) =>
        prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
      );
    };

    const handleSearch = (e) => {
      e.preventDefault();
      // Auto-apply handles this now, but keep for form submit accessibility
    };

    const updateURLWithFilters = (filters) => {
      const params = new URLSearchParams();

      if (filters.search) params.set("search", filters.search);
      if (filters.make) params.set("make", filters.make);
      if (filters.bodyType) params.set("bodyType", filters.bodyType);
      if (filters.fuelType) params.set("fuelType", filters.fuelType);
      if (filters.transmission)
        params.set("transmission", filters.transmission);
      if (filters.minPrice) params.set("minPrice", filters.minPrice.toString());
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
      if (filters.sortBy && filters.sortBy !== "newest")
        params.set("sortBy", filters.sortBy);

      const queryString = params.toString();
      const url = queryString ? `/cars?${queryString}` : "/cars";
      router.push(url);
    };

    const applyFilters = () => {
      if (isLoading) return;

      const filters = {
        search: searchQuery || undefined,
        make: selectedMakes.length > 0 ? selectedMakes[0] : undefined,
        bodyType:
          selectedBodyTypes.length > 0 ? selectedBodyTypes[0] : undefined,
        fuelType:
          selectedFuelTypes.length > 0 ? selectedFuelTypes[0] : undefined,
        transmission:
          selectedTransmissions.length > 0
            ? selectedTransmissions[0]
            : undefined,
        minPrice: committedPriceRange[0] > 0 ? committedPriceRange[0] : undefined,
        maxPrice:
          committedPriceRange[1] < maxPriceValue && committedPriceRange[1] > 0
            ? committedPriceRange[1]
            : undefined,
        sortBy: sortBy,
      };

      updateURLWithFilters(filters);

      if (onFilter) {
        onFilter(filters);
      }
    };

    const resetFilters = () => {
      setSearchQuery("");
      setSelectedMakes([]);
      setSelectedBodyTypes([]);
      setSelectedFuelTypes([]);
      setSelectedTransmissions([]);
      setPriceRange([0, maxPriceValue || 100000]);
      setCommittedPriceRange([0, maxPriceValue || 100000]);
      setSortBy("newest");

      const resetFilterValues = {
        search: undefined,
        make: undefined,
        bodyType: undefined,
        fuelType: undefined,
        transmission: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        sortBy: "newest",
      };

      router.push("/cars");

      if (onFilter) {
        onFilter(resetFilterValues);
      }

      fetchFilters();
    };

    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(price);
    };

    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl md:shadow-lg p-4 sm:p-5 w-full border-l-4 border-l-primary border-t border-r border-b border-white/20">
        <div className="flex items-center justify-between mb-4 sm:mb-5 pb-3 border-b border-slate-100">
          <h2 className="font-bold text-base sm:text-lg flex items-center bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
            <Filter className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600" /> Filters
          </h2>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary text-xs font-semibold px-2"
              >
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
        </div>



        <Accordion type="multiple" className="space-y-1 sm:space-y-2">
          <MakesFilter
            selectedMakes={selectedMakes}
            availableMakes={availableMakes}
            toggleFilter={toggleFilter}
            setSelectedMakes={setSelectedMakes}
            isLoading={isLoading}
          />

          <PriceRangeFilter
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            onPriceCommit={handlePriceCommit}
            maxPriceValue={maxPriceValue}
            formatPrice={formatPrice}
            isLoading={isLoading}
          />

          <BodyTypeFilter
            selectedBodyTypes={selectedBodyTypes}
            availableBodyTypes={availableBodyTypes}
            toggleFilter={toggleFilter}
            setSelectedBodyTypes={setSelectedBodyTypes}
            isLoading={isLoading}
          />

          <FuelTypeFilter
            selectedFuelTypes={selectedFuelTypes}
            availableFuelTypes={availableFuelTypes}
            toggleFilter={toggleFilter}
            setSelectedFuelTypes={setSelectedFuelTypes}
            isLoading={isLoading}
          />

          <TransmissionFilter
            selectedTransmissions={selectedTransmissions}
            availableTransmissions={availableTransmissions}
            toggleFilter={toggleFilter}
            setSelectedTransmissions={setSelectedTransmissions}
            isLoading={isLoading}
          />

        </Accordion>

        {activeFiltersCount > 0 && (
          <>
            <Separator className="my-3 sm:my-4" />
            <button
              onClick={resetFilters}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 mx-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset all filters
            </button>
          </>
        )}
      </div>
    );
  }
);

export default FilterPanel;
