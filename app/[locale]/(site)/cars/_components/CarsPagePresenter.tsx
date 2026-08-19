"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import FilterPanel from "./FilterPanel";
import CarsHero from "./CarsHero";
import ResultsSummary from "./ResultsSummary";
import { ActiveFilters } from "./ActiveFilters";
import { CompareTray } from "./CompareTray";
import CarCard from "@/components/CarCard";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import { Car, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Pagination, PaginationInfo } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import type { CarsPageData } from "../_lib/cars-types";

export const CarsPagePresenter = ({
  cars,
  pagination,
  loading,
  isFetching,
  isError,
  errorMessage,
  refetch,
  isPaging,
  isFilterPending,
  filters,
  searchValue,
  perPage,
  filterOptions,
  optionsLoading,
  activeFilters,
  handlers,
}: CarsPageData) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const hasActiveFilters = activeFilters.length > 0;
  const gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  const panelProps = {
    filters,
    options: filterOptions,
    handlers,
    isLoading: isFetching,
    optionsLoading,
    onReset: handlers.resetAllFilters,
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto mt-14 px-4 pb-24 pt-8">
        <CarsHero
          searchQuery={searchValue}
          onSearchChange={handlers.setSearch}
          onClearSearch={() => handlers.setSearch("")}
          totalCount={pagination.total}
          onQuickPick={handlers.applyPatch}
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Desktop sidebar */}
          <aside className="hidden w-full lg:sticky lg:top-24 lg:block lg:w-1/4 lg:self-start">
            <FilterPanel {...panelProps} />
          </aside>

          {/* Results */}
          <div className="w-full lg:w-3/4" id="cars-results-section">
            <ActiveFilters filters={activeFilters} onClearFilter={handlers.clearFilter} />

            {!isError && (cars.length > 0 || loading) && (
              <ResultsSummary
                currentPage={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                sortBy={filters.sortBy || "newest"}
                onSortChange={handlers.setSort}
                perPage={perPage}
                onPerPageChange={handlers.changePerPage}
                isLoading={isFetching}
              />
            )}

            {loading || isPaging || isFilterPending ? (
              <div className={`grid ${gridCols} gap-5 sm:gap-7`}>
                {Array.from({ length: perPage > 12 ? 12 : perPage }).map((_, i) => (
                  <CarCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-16 text-center">
                <h3 className="mb-2 text-lg font-semibold text-destructive">
                  Something went wrong
                </h3>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                  {errorMessage || "We couldn't load cars right now. Please try again."}
                </p>
                <Button onClick={() => refetch()} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : cars.length === 0 ? (
              hasActiveFilters ? (
                <EmptyState
                  variant="filtered"
                  title="No cars match your filters"
                  description="Try widening your price range or removing a filter to see more results."
                  onClearFilters={handlers.resetAllFilters}
                />
              ) : (
                <EmptyState
                  icon={Car}
                  title="No cars listed yet"
                  description="There are no vehicles available right now. Please check back soon."
                />
              )
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={isFetching ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}
              >
                <motion.div
                  className={`grid ${gridCols} gap-5 sm:gap-7`}
                  initial={reduceMotion ? false : "hidden"}
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.05 } },
                  }}
                >
                  {cars.map((car, i) => (
                    <motion.div
                      key={car.id}
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
                      }}
                    >
                      <CarCard car={car} index={i} />
                    </motion.div>
                  ))}
                </motion.div>

                {pagination.totalPages > 1 && (
                  <div className="mt-8 space-y-4 border-t border-border pt-4">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlers.changePage}
                      disabled={isFetching}
                    />
                    <PaginationInfo
                      currentPage={pagination.page}
                      limit={pagination.limit}
                      total={pagination.total}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter trigger — sticky bottom bar */}
      <div className="safe-area-inset-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur-md lg:hidden">
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[88%] flex-col p-0 sm:w-[360px]">
            <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
              <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel {...panelProps} />
            </div>
            <div className="sticky bottom-0 z-10 border-t border-border bg-background px-4 py-3">
              <Button className="w-full" onClick={() => setIsFilterOpen(false)}>
                Show {pagination.total.toLocaleString()} results
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <CompareTray />
    </div>
  );
};

export default CarsPagePresenter;
