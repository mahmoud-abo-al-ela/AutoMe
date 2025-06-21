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
    <div className="flex gap-2">
      <Button
        className="flex-1 cursor-pointer"
        onClick={applyFilters}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
        className={`cursor-pointer ${
          activeFiltersCount === 0 ? "opacity-50" : ""
        }`}
      >
        <ArrowDownUp className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default FilterBtn;
