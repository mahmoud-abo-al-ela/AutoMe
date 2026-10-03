"use client";

import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DealershipGridSkeleton,
  DealershipsErrorState,
  DealershipsGridView,
  HeroBanner,
  DealershipFilterBar,
} from "./index";
import { SiteEmptyState } from "@/components/brand";
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
  const t = useTranslations("dealerships.empty");
  const tCommon = useTranslations("common");
  const hasActiveFilters = activeFilters.length > 0;
  // Keep the previous grid mounted (dimmed) while re-fetching after the first
  // load, so filtering/paging doesn't flash the whole grid to skeletons.
  const showGrid = !loading && !isError && dealerships.length > 0;
  const showEmpty = !loading && !isError && dealerships.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 xl:px-0">
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
          <SiteEmptyState
            icon={Building2}
            title={t(hasActiveFilters ? "filteredTitle" : "noneTitle")}
            description={t(hasActiveFilters ? "filteredBody" : "noneBody")}
            primary={
              hasActiveFilters
                ? { label: tCommon("actions.clearFilters"), onClick: handlers.resetAllFilters }
                : { label: t("browseCars"), href: "/cars" }
            }
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
