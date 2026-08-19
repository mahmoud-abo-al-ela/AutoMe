"use client";

import { X, FilterX } from "lucide-react";
import { motion } from "framer-motion";
import type { CarsActiveFilter, CarsHandlers } from "../_lib/cars-types";

const TYPE_LABEL: Record<string, string> = {
  search: "Search",
  make: "Make",
  bodyType: "Body",
  fuelType: "Fuel",
  transmission: "Transmission",
  dealership: "Dealer",
  city: "Location",
  color: "Color",
  minSeats: "Seats",
  price: "Price",
  year: "Year",
  mileage: "Mileage",
};

export const ActiveFilters = ({
  filters,
  onClearFilter,
}: {
  filters: CarsActiveFilter[];
  onClearFilter: CarsHandlers["clearFilter"];
}) => {
  if (!filters || filters.length === 0) return null;

  return (
    <div className="mb-6 flex min-h-[32px] flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <motion.button
          key={`${filter.type}-${filter.value}`}
          type="button"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          onClick={() => onClearFilter(filter.type, filter.value)}
          aria-label={`Remove filter ${TYPE_LABEL[filter.type] || ""} ${filter.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-muted-foreground">{TYPE_LABEL[filter.type]}:</span>
          <span>{filter.label}</span>
          <X className="h-3 w-3" />
        </motion.button>
      ))}

      {filters.length > 1 && (
        <button
          type="button"
          onClick={() => onClearFilter("all")}
          className="ms-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <FilterX className="h-3.5 w-3.5" />
          Clear all
        </button>
      )}
    </div>
  );
};

export default ActiveFilters;
