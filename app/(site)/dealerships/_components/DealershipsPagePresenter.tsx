"use client";

import { Building2 } from "lucide-react";
import {
  DealershipGridSkeleton,
  DealershipsErrorState,
  DealershipsGridView,
  HeroBanner,
  DealershipFilterBar,
} from "./index";
import { EmptyState } from "@/components/common/EmptyState";
import type { useDealershipsPage } from "@/hooks/use-dealerships-page";

/**
 * Presentational shell for the dealerships listing. All state lives in
 * useDealershipsPage (via ClientPage); this component only renders.
 *
 * ClientPage spreads the whole hook result in, so the props are derived from it
 * rather than restated.
 */
export type DealershipsPageData = ReturnType<typeof useDealershipsPage>;

export const DealershipsPagePresenter = ({
  dealerships,
  pagination,
  loading,
  isFetching,
  isPaging,
  isError,
  errorMessage,
  refetch,
  filters,
  searchValue,
  perPage,
  filterOptions,
  activeFilters,
  handlers,
}: DealershipsPageData) => {
  const hasActiveFilters = activeFilters.length > 0;
  // Keep the previous grid mounted (dimmed) while re-fetching after the first
  // load, so filtering/paging doesn't flash the whole grid to skeletons.
  const showGrid = !loading && !isError && dealerships.length > 0;
  const showEmpty = !loading && !isError && dealerships.length === 0;

  return (
    <div className="container mx-auto py-4 px-4 mt-18">
      <HeroBanner
        searchQuery={searchValue}
        onSearchChange={handlers.setSearch}
        onClearSearch={() => handlers.setSearch("")}
        stats={filterOptions?.stats}
      />

      <DealershipFilterBar
        totalCount={pagination.total}
        filters={filters}
        filterOptions={filterOptions}
        perPage={perPage}
        activeFilters={activeFilters}
        onToggleFilter={handlers.toggleFilter}
        onSortChange={handlers.setSort}
        onPerPageChange={handlers.changePerPage}
        onClearFilter={handlers.clearFilter}
        onResetAll={handlers.resetAllFilters}
      />

      <div id="dealerships-results">
        {/* Loading (first load only) */}
        {loading && <DealershipGridSkeleton count={perPage} />}

        {/* Error */}
        {!loading && isError && (
          <DealershipsErrorState error={errorMessage} onRetry={refetch} />
        )}

        {/* Empty */}
        {showEmpty && (
          <EmptyState
            variant={hasActiveFilters ? "filtered" : "standalone"}
            icon={Building2}
            title={hasActiveFilters ? "No matching dealerships" : "No dealerships yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : "There are no dealerships to show right now. Check back soon."
            }
            onClearFilters={hasActiveFilters ? handlers.resetAllFilters : undefined}
            actionLabel={hasActiveFilters ? undefined : "Browse cars"}
            actionHref={hasActiveFilters ? undefined : "/cars"}
          />
        )}

        {/* Grid */}
        {showGrid && (
          <div
            className={
              isFetching && !isPaging
                ? "opacity-60 transition-opacity pointer-events-none"
                : "transition-opacity"
            }
            aria-busy={isFetching}
          >
            <DealershipsGridView
              dealerships={dealerships}
              pagination={pagination}
              loading={isFetching}
              onPageChange={handlers.changePage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DealershipsPagePresenter;
