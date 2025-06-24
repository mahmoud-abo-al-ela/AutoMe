import React from "react";
import { ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const FilterBtn = ({
  applyFilters,
  resetFilters,
  isLoading,
  activeFiltersCount,
}) => {
  return (
    <div className="flex gap-1.5 sm:gap-2">
      <Button
        className="flex-1 cursor-pointer text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
        onClick={applyFilters}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Filtering...
          </>
        ) : (
          <>Apply Filters</>
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={resetFilters}
        title="Reset filters"
        disabled={isLoading || activeFiltersCount === 0}
        className={`cursor-pointer h-8 w-8 sm:h-10 sm:w-10 ${
          activeFiltersCount === 0 ? "opacity-50" : ""
        }`}
      >
        <ArrowDownUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
};

export default FilterBtn;
