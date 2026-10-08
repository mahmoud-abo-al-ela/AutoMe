"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Car, SearchX, SlidersHorizontal } from "lucide-react";
import FilterPanel from "./FilterPanel";
import CarsHero from "./CarsHero";
import ResultsSummary, { type ResultsView } from "./ResultsSummary";
import { ActiveFilters } from "./ActiveFilters";
import { CompareTray } from "./CompareTray";
import { ListingRow } from "./ListingRow";
import CarCard from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Pagination } from "@/components/common/Pagination";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import { SiteEmptyState } from "@/components/brand";
import type { CarsPageData } from "../_lib/cars-types";
import { useFormatters } from "@/hooks/use-formatters";

const VIEW_KEY = "autome.cars.view";

/**
 * Browse page (Figma: Browse — desktop / mobile). Desktop: a sticky filter
 * rail with live counts beside the results. Phones: a sticky toolbar with the
 * Filters sheet and sort — the old fixed bottom filter bar sat under the tab
 * bar. The list view is a desktop layout; it applies only once a ≥1024px
 * viewport is confirmed after hydration, so the server render is always grid.
 */
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
  const t = useTranslations("cars");
  const fmt = useFormatters();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [view, setView] = useState<ResultsView>("grid");
  const [isDesktop, setIsDesktop] = useState(false);
  const hasActiveFilters = activeFilters.length > 0;

  useEffect(() => {
    // A per-viewer convenience: storage can be unavailable (private mode).
    try {
      if (localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {}
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const changeView = (next: ResultsView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  };

  const panelProps = {
    filters,
    options: filterOptions,
    handlers,
    isLoading: isFetching,
    optionsLoading,
    onReset: handlers.resetAllFilters,
  };
  const showList = view === "list" && isDesktop;

  const filtersButton = (
    <Button variant="outline-strong" size="control" className="lg:hidden" onClick={() => setIsFilterOpen(true)}>
      <SlidersHorizontal />
      {hasActiveFilters ? t("filters.openWithCount", { value: fmt.number(activeFilters.length) }) : t("filters.open")}
    </Button>
  );

  let results: React.ReactNode;
  if (loading || isPaging || isFilterPending) {
    results = (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
        {Array.from({ length: Math.min(perPage, 12) }).map((_, i) => (
          <CarCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (isError) {
    results = (
      <div role="alert" className="flex flex-wrap items-center gap-4 rounded-control border border-destructive bg-destructive-soft p-4">
        <AlertCircle aria-hidden className="size-6 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("states.errorTitle")}</p>
          <p className="text-caption text-muted-foreground">{errorMessage || t("states.errorBody")}</p>
        </div>
        <Button variant="outline-strong" size="control" onClick={() => refetch()}>
          {t("states.retry")}
        </Button>
      </div>
    );
  } else if (cars.length === 0) {
    results = hasActiveFilters ? (
      <SiteEmptyState
        icon={SearchX}
        title={t("states.filteredEmptyTitle")}
        description={t("states.filteredEmptyBody")}
        primary={{ label: t("filters.clearAll"), onClick: handlers.resetAllFilters }}
      />
    ) : (
      <SiteEmptyState icon={Car} title={t("states.emptyTitle")} description={t("states.emptyBody")} />
    );
  } else {
    results = (
      <div className={isFetching ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
        {showList ? (
          <ul className="flex flex-col gap-4">
            {cars.map((car, i) => (
              <li key={car.id}>
                <ListingRow car={car} index={i} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {cars.map((car, i) => (
              <li key={car.id}>
                <CarCard car={car} index={i} />
              </li>
            ))}
          </ul>
        )}
        {pagination.totalPages > 1 && (
          <div className="mt-10 border-t border-border pt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlers.changePage}
              disabled={isFetching}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 xl:px-0">
      <CarsHero
        searchQuery={searchValue}
        onSearchChange={handlers.setSearch}
        onClearSearch={() => handlers.setSearch("")}
      />

      <div className="flex gap-6">
        {/* scrollbar-end: the rail's bar stays on the right in Arabic, on the
            same side as the page's (globals.css). */}
        <aside className="scrollbar-end sticky top-[88px] hidden max-h-[calc(100dvh-104px)] w-[296px] shrink-0 self-start overflow-y-auto overscroll-contain lg:block">
          <FilterPanel {...panelProps} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4" id="cars-results-section">
          <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <ResultsSummary
              total={pagination.total}
              sortBy={filters.sortBy || "newest"}
              onSortChange={handlers.setSort}
              view={view}
              onViewChange={changeView}
              isLoading={isFetching}
              leading={filtersButton}
            />
          </div>
          <ActiveFilters filters={activeFilters} onClearFilter={handlers.clearFilter} />
          {results}
        </div>
      </div>

      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="bottom" className="max-h-[90dvh] gap-0 rounded-t-sheet border-0 bg-card p-0">
          <div className="flex items-center border-b border-border px-4 py-3">
            <SheetTitle className="text-body font-semibold">{t("filters.title")}</SheetTitle>
          </div>
          <div className="scrollbar-end flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
            <FilterPanel {...panelProps} />
          </div>
          <div className="border-t border-border bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <Button variant="marker" size="xl" className="w-full" onClick={() => setIsFilterOpen(false)}>
              {t("filters.showResults", { count: pagination.total, value: fmt.number(pagination.total) })}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <CompareTray />
    </div>
  );
};

export default CarsPagePresenter;
