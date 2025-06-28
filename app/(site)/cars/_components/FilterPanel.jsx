"use client";
import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import { getCarsFilters } from "@/actions/cars-listing";
import { Separator } from "@/components/ui/separator";
import { Accordion } from "@/components/ui/accordion";
import { useRouter, useSearchParams } from "next/navigation";

import {
  SearchBar,
  MakesFilter,
  PriceRangeFilter,
  BodyTypeFilter,
  FuelTypeFilter,
  TransmissionFilter,
  SortByFilter,
  FilterBtn,
} from "./filter-components";

const FilterPanel = forwardRef(
  ({ onFilter, isLoading = false, initialFilters = {} }, ref) => {
    const router = useRouter();
    const searchParams = useSearchParams();

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
      if (initialFilters.search) setSearchQuery(initialFilters.search);
      if (initialFilters.make) setSelectedMakes([initialFilters.make]);
      if (initialFilters.bodyType)
        setSelectedBodyTypes([initialFilters.bodyType]);
      if (initialFilters.fuelType)
        setSelectedFuelTypes([initialFilters.fuelType]);
      if (initialFilters.transmission)
        setSelectedTransmissions([initialFilters.transmission]);
      if (initialFilters.sortBy) setSortBy(initialFilters.sortBy);

      if (
        (initialFilters.minPrice || initialFilters.maxPrice) &&
        maxPriceValue > 0
      ) {
        setPriceRange([
          initialFilters.minPrice || 0,
          initialFilters.maxPrice || maxPriceValue,
        ]);
      }
    }, [initialFilters, maxPriceValue]);

    useEffect(() => {
      fetchFilters();
    }, []);

    useEffect(() => {
      if (filtersData?.success && filtersData?.data) {
        const { makes, bodyTypes, fuelTypes, transmissions, priceRanges } =
          filtersData.data;

        setAvailableMakes(makes || []);
        setAvailableBodyTypes(bodyTypes || []);
        setAvailableFuelTypes(fuelTypes || []);
        setAvailableTransmissions(transmissions || []);

        if (priceRanges?.max) {
          setMaxPriceValue(priceRanges.max);
          if (priceRange[1] === 0) {
            setPriceRange([
              initialFilters.minPrice || 0,
              initialFilters.maxPrice || priceRanges.max,
            ]);
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
        priceRange[0] > 0 ||
        (priceRange[1] < maxPriceValue &&
          priceRange[1] > 0 &&
          maxPriceValue > 0)
          ? 1
          : 0,
        sortBy !== "newest" ? 1 : 0,
      ].reduce((a, b) => a + b, 0);

      setActiveFiltersCount(count);
    }, [
      searchQuery,
      selectedMakes,
      selectedBodyTypes,
      selectedFuelTypes,
      selectedTransmissions,
      priceRange,
      maxPriceValue,
      sortBy,
    ]);

    const toggleFilter = (item, selectedItems, setSelectedItems) => {
      if (isLoading) return;
      setSelectedItems((prev) =>
        prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
      );
    };

    const handleSearch = (e) => {
      e.preventDefault();
      if (!isLoading) {
        applyFilters();
      }
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
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice:
          priceRange[1] < maxPriceValue && priceRange[1] > 0
            ? priceRange[1]
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
      <div className="bg-white rounded-lg md:shadow-md p-3 sm:p-4 w-full">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-semibold text-base sm:text-lg flex items-center">
            <Filter className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Filters
          </h2>
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary text-xs sm:text-sm"
            >
              {activeFiltersCount} active
            </Badge>
          )}
        </div>

        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          isLoading={isLoading}
        />

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

          <SortByFilter
            sortBy={sortBy}
            setSortBy={setSortBy}
            isLoading={isLoading}
          />
        </Accordion>

        <Separator className="my-3 sm:my-4" />

        <FilterBtn
          applyFilters={applyFilters}
          resetFilters={resetFilters}
          isLoading={isLoading}
          activeFiltersCount={activeFiltersCount}
        />
      </div>
    );
  }
);

export default FilterPanel;
