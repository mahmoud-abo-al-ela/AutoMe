import type {
  getDealershipBySlug,
  getDealershipCars,
  getDealershipCarFilters,
} from "@/actions/dealerships";
import type { ActionResponse } from "@/lib/utils/response";

/** Unwrap an action's success payload from the ActionResponse envelope. */
type PayloadOf<T> = Awaited<T> extends ActionResponse<infer D> ? D : never;

export type DealershipDetail = PayloadOf<ReturnType<typeof getDealershipBySlug>>;

type DealershipCarsData = PayloadOf<ReturnType<typeof getDealershipCars>>;
/** The serializer can yield null entries; the page filters them before render. */
export type DealershipCar = NonNullable<DealershipCarsData["cars"][number]>;
export type DealershipCarsPagination = DealershipCarsData["pagination"];

export type DealershipCarFilterOptions = PayloadOf<
  ReturnType<typeof getDealershipCarFilters>
>;

/** The inventory filter state the detail page keeps in React state. */
export interface DealershipInventoryFilterState {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  sortBy?: string;
}

/** One removable chip in the active-filter row. */
export interface ActiveFilterChip {
  type: string;
  label: string;
  field: string;
  value?: string;
}

/**
 * The inventory props threaded from the detail presenter down through the tabs
 * to the cars section — declared once rather than restated at each level.
 */
export interface DealershipInventoryProps {
  cars: DealershipCar[];
  carsLoading: boolean;
  carsPagination: DealershipCarsPagination;
  onPageChange: (page: number) => void;
  filters: DealershipInventoryFilterState;
  onFilterChange: (filters: DealershipInventoryFilterState) => void;
  availableFilters: DealershipCarFilterOptions | null;
}
