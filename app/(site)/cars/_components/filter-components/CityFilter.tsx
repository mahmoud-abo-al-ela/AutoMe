"use client";

import { MapPin } from "lucide-react";
import { FilterSection } from "./FilterSection";
import type { SingleFacetProps } from "../../_lib/cars-types";
import { FilterChip } from "./FilterChip";

const CityFilter = ({
  selected,
  options = [],
  onSelect,
  isLoading,
}: SingleFacetProps) => {
  return (
    <FilterSection
      value="city"
      icon={MapPin}
      label="Location"
      count={selected ? 1 : 0}
      isEmpty={options.length === 0}
      emptyLabel="No locations available"
    >
      <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
        {options.map((city) => {
          const isSelected = selected === city;
          return (
            <FilterChip
              key={city}
              label={city}
              selected={isSelected}
              disabled={isLoading}
              onClick={() => onSelect(isSelected ? undefined : city)}
            />
          );
        })}
      </div>
    </FilterSection>
  );
};

export default CityFilter;
