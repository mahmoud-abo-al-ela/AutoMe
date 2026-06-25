"use client";

import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import {
  DealershipGridSkeleton,
  DealershipsErrorState,
  DealershipsGridView,
  HeroBanner,
  InlineToolbar,
} from "./index";
import { EmptyState } from "@/components/common/EmptyState";
import { getDealerships, getDealershipFilters } from "@/actions/dealerships";
import { useDebounce } from "@/hooks/use-debounce";

export const DealershipsPagePresenter = () => {
  const [dealerships, setDealerships] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    minRating: undefined,
    city: undefined,
    sortBy: "rating",
    sortOrder: "desc",
  });
  const [filterOptions, setFilterOptions] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await getDealershipFilters();
        if (response.success) {
          setFilterOptions(response.data);
        }
      } catch (err) {
        console.error("Error fetching filter options:", err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch dealerships when filters or pagination changes
  useEffect(() => {
    const fetchDealerships = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getDealerships(filters, {
          page: pagination.page,
          limit: pagination.limit,
        });
        if (response.success) {
          setDealerships(response.data.dealerships);
          setPagination(response.data.pagination);
        } else {
          setError(response.error?.message || "Failed to load dealerships");
        }
      } catch (err) {
        console.error("Error fetching dealerships:", err);
        setError("Failed to load dealerships. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchDealerships();
  }, [filters, pagination.page]);

  // Update search filter when debounced search changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearch,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleRatingChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      minRating: prev.minRating === value ? undefined : value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCityChange = (city) => {
    setFilters((prev) => ({
      ...prev,
      city: prev.city === city ? undefined : city,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetAllFilters = () => {
    const clearedFilters = {
      search: "",
      minRating: undefined,
      city: undefined,
      sortBy: "rating",
      sortOrder: "desc",
    };
    setFilters(clearedFilters);
    setSearchQuery("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="container mx-auto py-4 px-4 mt-18">
      {/* Hero Banner with integrated search */}
      <HeroBanner
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={clearSearch}
        stats={filterOptions?.stats}
      />

      {/* Inline Toolbar: result count + rating chips + sort */}
      <InlineToolbar
        totalCount={pagination.total}
        filters={filters}
        filterOptions={filterOptions}
        onRatingChange={handleRatingChange}
        onCityChange={handleCityChange}
        onSortChange={handleSortChange}
      />

      {/* Loading State */}
      {loading && <DealershipGridSkeleton count={8} />}

      {/* Error State */}
      {error && <DealershipsErrorState error={error} />}

      {/* Empty State */}
      {!loading && !error && dealerships.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No dealerships found"
          description="We couldn't find any dealerships matching your current filters."
          actionLabel="Reset Filters"
          onAction={resetAllFilters}
        />
      )}

      {/* Full-width Grid View */}
      {!loading && !error && dealerships.length > 0 && (
        <DealershipsGridView
          dealerships={dealerships}
          pagination={pagination}
          loading={loading}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default DealershipsPagePresenter;
