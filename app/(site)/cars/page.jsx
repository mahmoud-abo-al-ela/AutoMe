"use client";
import React, { useState, useEffect, useRef } from "react";
import FilterPanel from "./_components/FilterPanel";
import { getCars } from "@/actions/cars-listing";
import CarCard from "@/components/CarCard";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import useFetch from "@/hooks/use-fetch";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSearchParams, useRouter } from "next/navigation";

const BrowseCarsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: undefined,
    make: undefined,
    bodyType: undefined,
    fuelType: undefined,
    transmission: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: "newest",
  });
  const filterPanelRef = useRef(null);

  const {
    data: carsData,
    loading: isLoading,
    error,
    fn: fetchCars,
  } = useFetch(getCars, true);

  useEffect(() => {
    const initialFilters = {
      search: searchParams.get("search") || undefined,
      make: searchParams.get("make") || undefined,
      bodyType: searchParams.get("bodyType") || undefined,
      fuelType: searchParams.get("fuelType") || undefined,
      transmission: searchParams.get("transmission") || undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      sortBy: searchParams.get("sortBy") || "newest",
      page: 1,
    };

    const hasFilters = Object.values(initialFilters).some(
      (value) => value !== undefined
    );

    if (hasFilters) {
      setFilters(initialFilters);
      fetchCars(initialFilters);
    } else {
      fetchCars({ ...filters, page });
    }
  }, []);

  const handleFilterChange = (newFilters) => {
    setPage(1);
    const updatedFilters = { ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchCars(updatedFilters);
    setIsFilterOpen(false);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchCars({ ...filters, page: newPage });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());

    const queryString = params.toString();
    router.push(`/cars?${queryString}`);
  };

  const cars = carsData?.success ? carsData.data.cars : [];
  const pagination = carsData?.success
    ? carsData.data.pagination
    : { total: 0, page: 1, limit: 9, totalPages: 0 };

  const getActiveFilters = () => {
    const filterMap = {
      search: (val) => ({ type: "search", value: val }),
      make: (val) => ({ type: "make", value: val }),
      bodyType: (val) => ({ type: "bodyType", value: val }),
      fuelType: (val) => ({ type: "fuelType", value: val }),
      transmission: (val) => ({ type: "transmission", value: val }),
    };

    const activeFilters = Object.entries(filters)
      .filter(([key, value]) => value !== undefined && key in filterMap)
      .map(([key, value]) => filterMap[key](value));

    if (filters.minPrice || filters.maxPrice) {
      const priceFilter = [];
      if (filters.minPrice)
        priceFilter.push(`Min: $${filters.minPrice.toLocaleString()}`);
      if (filters.maxPrice)
        priceFilter.push(`Max: $${filters.maxPrice.toLocaleString()}`);
      activeFilters.push({ type: "price", value: priceFilter.join(" - ") });
    }

    if (filters.sortBy && filters.sortBy !== "newest") {
      const sortLabel =
        filters.sortBy === "priceAsc"
          ? "Price: Low to High"
          : "Price: High to Low";
      activeFilters.push({ type: "sort", value: sortLabel });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0;

  const renderPaginationButton = (pageNum) => (
    <Button
      key={pageNum}
      variant={pagination.page === pageNum ? "default" : "outline"}
      size="sm"
      onClick={() => handlePageChange(pageNum)}
      className="w-8 h-8 sm:w-10 sm:h-10 cursor-pointer"
    >
      {pageNum}
    </Button>
  );

  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pageNumbers = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i);
      }
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      for (let i = page - 2; i <= page + 2; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  const clearFilter = (filterType) => {
    const updatedFilters = { ...filters };

    switch (filterType) {
      case "search":
        updatedFilters.search = undefined;
        break;
      case "make":
        updatedFilters.make = undefined;
        break;
      case "bodyType":
        updatedFilters.bodyType = undefined;
        break;
      case "fuelType":
        updatedFilters.fuelType = undefined;
        break;
      case "transmission":
        updatedFilters.transmission = undefined;
        break;
      case "price":
        updatedFilters.minPrice = undefined;
        updatedFilters.maxPrice = undefined;
        break;
      case "sort":
        updatedFilters.sortBy = "newest";
        break;
      default:
        break;
    }

    setPage(1);
    setFilters(updatedFilters);
    fetchCars({ ...updatedFilters, page: 1 });

    const params = new URLSearchParams();

    if (updatedFilters.search) params.set("search", updatedFilters.search);
    if (updatedFilters.make) params.set("make", updatedFilters.make);
    if (updatedFilters.bodyType)
      params.set("bodyType", updatedFilters.bodyType);
    if (updatedFilters.fuelType)
      params.set("fuelType", updatedFilters.fuelType);
    if (updatedFilters.transmission)
      params.set("transmission", updatedFilters.transmission);
    if (updatedFilters.minPrice)
      params.set("minPrice", updatedFilters.minPrice.toString());
    if (updatedFilters.maxPrice)
      params.set("maxPrice", updatedFilters.maxPrice.toString());
    if (updatedFilters.sortBy && updatedFilters.sortBy !== "newest")
      params.set("sortBy", updatedFilters.sortBy);

    const queryString = params.toString();
    const url = queryString ? `/cars?${queryString}` : "/cars";
    router.push(url);
  };

  const resetAllFilters = () => {
    const resetFilters = {
      search: undefined,
      make: undefined,
      bodyType: undefined,
      fuelType: undefined,
      transmission: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: "newest",
    };

    setPage(1);
    setFilters(resetFilters);
    fetchCars({ ...resetFilters, page: 1 });

    if (filterPanelRef.current) {
      filterPanelRef.current.resetFilters();
    }

    router.push("/cars");
  };

  return (
    <div className="container mx-auto py-4 px-4 mt-18">
      <h1 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-10">
        Browse Available Cars
      </h1>

      <div className="lg:hidden mb-4">
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              <span>
                Filters {hasActiveFilters && `(${activeFilters.length})`}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85%] sm:w-[350px] p-0 overflow-y-auto"
          >
            <div className="p-4 pb-24">
              <FilterPanel
                ref={filterPanelRef}
                onFilter={handleFilterChange}
                isLoading={isLoading}
                initialFilters={filters}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="hidden lg:block w-full lg:w-1/4 lg:sticky lg:top-24 lg:self-start">
          <FilterPanel
            ref={filterPanelRef}
            onFilter={handleFilterChange}
            isLoading={isLoading}
            initialFilters={filters}
          />
        </div>

        <div className="w-full lg:w-3/4">
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeFilters.map((filter, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-primary/5 flex items-center gap-1 py-1 px-2"
                >
                  {filter.type === "search"
                    ? `Search: ${filter.value}`
                    : filter.type === "make"
                    ? `Make: ${filter.value}`
                    : filter.type === "bodyType"
                    ? `Body: ${filter.value}`
                    : filter.type === "fuelType"
                    ? `Fuel: ${filter.value}`
                    : filter.type === "transmission"
                    ? `Trans: ${filter.value}`
                    : filter.type === "price"
                    ? `Price: ${filter.value}`
                    : filter.type === "sort"
                    ? `Sort: ${filter.value}`
                    : filter.value}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => clearFilter(filter.type)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <CarCardSkeleton key={index} />
              ))}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Error loading cars
              </h3>
              <p className="text-red-600">
                Please try again later or adjust your filters.
              </p>
            </div>
          )}
          {!isLoading && !error && cars.length === 0 && carsData && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 sm:p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No cars found</h3>
              <p className="text-slate-600 mb-4">
                We couldn't find any cars matching your current filters.
              </p>
              <Button onClick={resetAllFilters} className="cursor-pointer">
                Reset Filters
              </Button>
            </div>
          )}
          {!isLoading && !error && cars.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {cars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6 sm:mt-8">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto px-1">
                      {getPageNumbers().map(renderPaginationButton)}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseCarsPage;
