"use client";

import { Filter, RotateCcw, CircleDollarSign, Calendar, Gauge } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import type {
  CarsFilterOptions,
  CarsFilters,
  CarsHandlers,
} from "../_lib/cars-types";


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
    <div className="w-full lg:rounded-control lg:border lg:border-border lg:bg-card lg:px-4 lg:pb-2">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border max-lg:hidden">
        <h2 className="flex items-center gap-2 text-body font-semibold">
          <Filter aria-hidden className="size-4" />
          {t("title")}
          {activeCount > 0 && (
            <span className="rounded-full bg-inverse px-2 text-micro text-inverse-foreground">
              {t("activeCount", { value: fmt.number(activeCount) })}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="flex min-h-10 items-center gap-1.5 text-caption font-medium text-primary hover:underline disabled:opacity-50"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            {t("resetAll")}
          </button>
        )}
      </div>

      {/* Several sections open at once: price and body type are what most
          people set first, so they start open; the rest stay one tap away. */}
      <Accordion type="multiple" defaultValue={["price", "body", "makes"]}>
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

      {/* Phones: the sheet has no rail header, so reset sits under the list. */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          disabled={isLoading}
          className="mx-auto mt-3 flex min-h-11 items-center gap-1.5 text-caption font-medium text-primary hover:underline disabled:opacity-50 lg:hidden"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          {t("resetAll")}
        </button>
      )}
    </div>
  );
};

export default FilterPanel;
