"use client";
import React, { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import { getCarsFilters } from "@/actions/cars-listing";
import { Separator } from "@/components/ui/separator";
import { Accordion } from "@/components/ui/accordion";

// Import smaller components
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

const FilterPanel = ({ onFilter, isLoading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMakes, setSelectedMakes] = useState([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [maxPriceValue, setMaxPriceValue] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
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
        setPriceRange([0, priceRanges.max]);
      }
    }
  }, [filtersData]);

  useEffect(() => {
    const count = [
      searchQuery ? 1 : 0,
      selectedMakes.length,
      selectedBodyTypes.length,
      selectedFuelTypes.length,
      selectedTransmissions.length,
      priceRange[0] > 0 ||
      (priceRange[1] < maxPriceValue && priceRange[1] > 0 && maxPriceValue > 0)
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

  // Generic toggle function for all filter types
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

  const applyFilters = () => {
    if (isLoading) return;

    const filters = {
      search: searchQuery || undefined,
      make: selectedMakes.length > 0 ? selectedMakes[0] : undefined,
      bodyType: selectedBodyTypes.length > 0 ? selectedBodyTypes[0] : undefined,
      fuelType: selectedFuelTypes.length > 0 ? selectedFuelTypes[0] : undefined,
      transmission:
        selectedTransmissions.length > 0 ? selectedTransmissions[0] : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice:
        priceRange[1] < maxPriceValue && priceRange[1] > 0
          ? priceRange[1]
          : undefined,
      sortBy: sortBy,
    };

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
    <div className="bg-white rounded-lg shadow-md p-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg flex items-center">
          <Filter className="mr-2 h-5 w-5" /> Filters
        </h2>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
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

      <Accordion type="multiple" className="space-y-2">
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

      <Separator className="my-4" />

      <FilterBtn
        applyFilters={applyFilters}
        resetFilters={resetFilters}
        isLoading={isLoading}
        activeFiltersCount={activeFiltersCount}
      />
    </div>
  );
};

export default FilterPanel;
