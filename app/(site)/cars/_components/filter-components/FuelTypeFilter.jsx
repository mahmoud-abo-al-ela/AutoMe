"use client";

import { Fuel } from "lucide-react";
import { FilterSection } from "./FilterSection";
import { FilterChip } from "./FilterChip";

const FuelTypeFilter = ({ selected = [], options = [], onToggle, isLoading }) => {
  return (
    <FilterSection
      value="fuel"
      icon={Fuel}
      label="Fuel Type"
      count={selected.length}
      isEmpty={options.length === 0}
      emptyLabel="No fuel types available"
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
