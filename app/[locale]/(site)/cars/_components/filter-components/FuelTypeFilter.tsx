"use client";

import { Fuel } from "lucide-react";
import { FilterSection } from "./FilterSection";
import { FilterChip } from "./FilterChip";
import type { MultiFacetProps } from "../../_lib/cars-types";
import { useTranslations } from "next-intl";

const FuelTypeFilter = ({
  selected = [],
  options = [],
  onToggle,
  isLoading,
}: MultiFacetProps) => {
  const t = useTranslations("cars.filters");
  return (
    <FilterSection
      value="fuel"
      icon={Fuel}
      label={t("fuelType")}
      count={selected.length}
      isEmpty={options.length === 0}
      emptyLabel={t("fuelTypeEmpty")}
    >
      <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
        {options.map(({ value, count }) => (
          <FilterChip
            key={value}
            label={value}
            count={count}
            selected={selected.includes(value)}
            disabled={isLoading}
            onClick={() => onToggle(value)}
          />
        ))}
      </div>
    </FilterSection>
  );
};

export default FuelTypeFilter;
