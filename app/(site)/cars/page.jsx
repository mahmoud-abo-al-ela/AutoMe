"use client";
import React, { useState, useEffect } from "react";
import FilterPanel from "./_components/FilterPanel";
import { getCars } from "@/actions/cars-listing";
import CarCard from "@/components/CarCard";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import useFetch from "@/hooks/use-fetch";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BrowseCarsPage = () => {
  const [page, setPage] = useState(1);
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

  const {
    data: carsData,
    loading: isLoading,
    error,
    fn: fetchCars,
  } = useFetch(getCars, true);

  const handleFilterChange = (newFilters) => {
    setPage(1);
    const updatedFilters = { ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchCars(updatedFilters);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchCars({ ...filters, page: newPage });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    fetchCars({ ...filters, page });
  }, []);

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

  // Helper function to render pagination buttons
  const renderPaginationButton = (pageNum) => (
    <Button
      key={pageNum}
      variant={pagination.page === pageNum ? "default" : "outline"}
      size="sm"
      onClick={() => handlePageChange(pageNum)}
      className="w-10 h-10 cursor-pointer"
    >
      {pageNum}
    </Button>
  );

  // Calculate page numbers for pagination
  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pageNumbers = [];

    if (totalPages <= 5) {
      // Show all pages if there are 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (page <= 3) {
      // Near the start
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i);
      }
    } else if (page >= totalPages - 2) {
      // Near the end
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // In the middle
      for (let i = page - 2; i <= page + 2; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="container mx-auto py-4 px-4 mt-20">
      <h1 className="text-3xl font-bold mb-10">Browse Available Cars</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/4 ">
          <FilterPanel onFilter={handleFilterChange} isLoading={isLoading} />
        </div>

        <div className="w-full lg:w-3/4">
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="outline" className="bg-primary/5">
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
                </Badge>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No cars found</h3>
              <p className="text-slate-600 mb-4">
                We couldn't find any cars matching your current filters.
              </p>
              <Button
                onClick={() =>
                  handleFilterChange({
                    search: undefined,
                    make: undefined,
                    bodyType: undefined,
                    fuelType: undefined,
                    transmission: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    sortBy: "newest",
                  })
                }
                className="cursor-pointer"
              >
                Reset Filters
              </Button>
            </div>
          )}
          {!isLoading && !error && cars.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {getPageNumbers().map(renderPaginationButton)}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="cursor-pointer"
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
