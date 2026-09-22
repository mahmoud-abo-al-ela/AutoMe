"use client";

import { MapPin } from "lucide-react";
import { FilterSection } from "./FilterSection";
import type { SingleFacetProps } from "../../_lib/cars-types";
import { FilterChip } from "./FilterChip";
import { useTranslations } from "next-intl";
import { usePlaceNames } from "@/hooks/use-place-names";

const CityFilter = ({
  selected,
  options = [],
  onSelect,
  isLoading,
}: SingleFacetProps) => {
  const t = useTranslations("cars.filters");
  const place = usePlaceNames();

  return (
    <FilterSection
      value="city"
      icon={MapPin}
      label={t("city")}
      count={selected ? 1 : 0}
      isEmpty={options.length === 0}
      emptyLabel={t("cityEmpty")}
    >
      <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
        {options.map((city) => {
          const isSelected = selected === city;
          return (
            <FilterChip
              key={city}
              label={place.city(city)}
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
