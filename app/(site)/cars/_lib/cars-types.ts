import type { useCarsPage } from "@/hooks/use-cars-page";

/** Everything `useCarsPage` returns; ClientPage spreads it into the presenter. */
export type CarsPageData = ReturnType<typeof useCarsPage>;

export type CarListItem = CarsPageData["cars"][number];
export type CarsFilters = CarsPageData["filters"];
export type CarsFilterOptions = CarsPageData["filterOptions"];
export type CarsActiveFilter = CarsPageData["activeFilters"][number];
export type CarsPagination = CarsPageData["pagination"];
export type CarsHandlers = CarsPageData["handlers"];

/**
 * One value in a facet, with its result count. The car repository is JS by
 * design (dynamic groupBy), so the shape is declared here rather than inferred.
 */
export interface FacetOption {
  value: string;
  count: number;
}

/** A facet the user can select several values from (make, body type, …). */
export interface MultiFacetProps {
  selected?: string[];
  options?: FacetOption[];
  onToggle: (value: string) => void;
  isLoading?: boolean;
}

/**
 * A facet with a single selected value. `onSelect(undefined)` clears it, which
 * is how every one of these deselects the active chip.
 */
export interface SingleFacetProps<TOption = string> {
  selected?: string | number | null;
  options?: TOption[];
  onSelect: (value: string | undefined) => void;
  isLoading?: boolean;
}

/** A dealership option carries its own slug/name rather than a counted value. */
export interface DealershipFacetOption {
  slug: string;
  name: string;
}
