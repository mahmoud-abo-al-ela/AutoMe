"use client";

import { Filter, RotateCcw, CircleDollarSign, Calendar, Gauge } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import type {
  CarsFilterOptions,
  CarsFilters,
  CarsHandlers,
} from "../_lib/cars-types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion } from "@/components/ui/accordion";

import {
  MakesFilter,
  RangeFilter,
  BodyTypeFilter,
  FuelTypeFilter,
  TransmissionFilter,
  DealershipFilter,
  CityFilter,
  ColorFilter,
  SeatsFilter,
} from "./filter-components";
import { useTranslations } from "next-intl";



/**
 * Presentational filter sidebar. All state lives in useCarsPage; this component
 * only renders the current `filters` and emits changes through `handlers`.
 */
const FilterPanel = ({
  filters,
  options,
  handlers,
  isLoading = false,
  optionsLoading = false,
  onReset,
}: {
  filters: CarsFilters;
  options: CarsFilterOptions;
  handlers: CarsHandlers;
  isLoading?: boolean;
  optionsLoading?: boolean;
  onReset: () => void;
}) => {
  const t = useTranslations("cars.filters");
  const fmt = useFormatters();
  // These were module-scope helpers with no locale argument, so the range
  // labels stayed English while the cards beside them were translated.
  const formatPrice = (v: number) => fmt.price(v || 0);
  const formatMileage = (v: number) => fmt.mileage(v);
  // A year is a number but never a quantity, so no grouping separator.
  const formatYear = (v: number) => fmt.number(v, { useGrouping: false });
  const opts = options || ({} as NonNullable<CarsFilterOptions>);
  const disabled = isLoading || optionsLoading;

  const activeCount =
    (filters.search ? 1 : 0) +
    (filters.make?.length || 0) +
    (filters.bodyType?.length || 0) +
    (filters.fuelType?.length || 0) +
    (filters.transmission?.length || 0) +
    (filters.dealership ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.color ? 1 : 0) +
    (filters.minSeats ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minYear || filters.maxYear ? 1 : 0) +
    (filters.minMileage || filters.maxMileage ? 1 : 0);

  return (
    <div className="w-full rounded-2xl border border-border border-s-4 border-s-primary bg-card p-4 sm:p-5 md:shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3 sm:mb-5">
        <h2 className="flex items-center text-base font-bold sm:text-lg">
          <Filter className="me-1.5 h-4 w-4 text-primary sm:me-2 sm:h-5 sm:w-5" />
          {t("title")}
        </h2>
        {activeCount > 0 && (
          <Badge variant="secondary" className="bg-primary/10 px-2 text-xs font-semibold text-primary">
            {t("activeCount", { value: fmt.number(activeCount) })}
          </Badge>
        )}
      </div>

      <Accordion type="single" collapsible className="space-y-1 sm:space-y-2">
        <DealershipFilter
          selected={filters.dealership}
          options={opts.dealerships}
          onSelect={(v) => handlers.setFilter("dealership", v)}
          isLoading={disabled}
        />

        <CityFilter
          selected={filters.city}
          options={opts.cities}
          onSelect={(v) => handlers.setFilter("city", v)}
          isLoading={disabled}
        />

        <MakesFilter
          selected={filters.make}
          options={opts.makes}
          onToggle={(v) => handlers.toggleMulti("make", v)}
          isLoading={disabled}
        />

        <RangeFilter
          sectionValue="price"
          icon={CircleDollarSign}
          label={t("priceRange")}
          value={[filters.minPrice, filters.maxPrice]}
          bounds={opts.priceBounds}
          step={1000}
          formatValue={formatPrice}
          onCommit={(v, bounds) => handlers.commitRange("minPrice", "maxPrice", v, bounds)}
          isLoading={disabled}
        />

        <RangeFilter
          sectionValue="year"
          icon={Calendar}
          label={t("year")}
          value={[filters.minYear, filters.maxYear]}
          bounds={opts.yearBounds}
          step={1}
          formatValue={formatYear}
          onCommit={(v, bounds) => handlers.commitRange("minYear", "maxYear", v, bounds)}
          isLoading={disabled}
        />

        <RangeFilter
          sectionValue="mileage"
          icon={Gauge}
          label={t("mileage")}
          value={[filters.minMileage, filters.maxMileage]}
          bounds={opts.mileageBounds}
          step={1000}
          formatValue={formatMileage}
          onCommit={(v, bounds) => handlers.commitRange("minMileage", "maxMileage", v, bounds)}
          isLoading={disabled}
        />

        <BodyTypeFilter
          selected={filters.bodyType}
          options={opts.bodyTypes}
          onToggle={(v) => handlers.toggleMulti("bodyType", v)}
          isLoading={disabled}
        />

        <FuelTypeFilter
          selected={filters.fuelType}
          options={opts.fuelTypes}
          onToggle={(v) => handlers.toggleMulti("fuelType", v)}
          isLoading={disabled}
        />

        <TransmissionFilter
          selected={filters.transmission}
          options={opts.transmissions}
          onToggle={(v) => handlers.toggleMulti("transmission", v)}
          isLoading={disabled}
        />

        <ColorFilter
          selected={filters.color}
          options={opts.colors}
          onSelect={(v) => handlers.setFilter("color", v)}
          isLoading={disabled}
        />

        <SeatsFilter
          selected={filters.minSeats}
          onSelect={(v) => handlers.setFilter("minSeats", v)}
          isLoading={disabled}
        />
      </Accordion>

      {activeCount > 0 && (
        <>
          <Separator className="my-3 sm:my-4" />
          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("resetAll")}
          </button>
        </>
      )}
    </div>
  );
};

export default FilterPanel;
