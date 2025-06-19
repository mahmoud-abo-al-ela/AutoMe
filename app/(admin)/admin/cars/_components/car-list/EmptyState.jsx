import React from "react";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

const EmptyState = ({ searchTerm, statusFilter, onClearFilters }) => (
  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
    <Car className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
      No cars found
    </h3>
    <p className="text-sm sm:text-base text-gray-500 mb-4 max-w-md">
      {searchTerm || statusFilter !== "all"
        ? "Try adjusting your search or filters to find what you're looking for."
        : "Add your first car to start building your inventory."}
    </p>
    {(searchTerm || statusFilter !== "all") && (
      <Button
        variant="outline"
        onClick={onClearFilters}
        className="mb-2 text-sm"
      >
        Clear filters
      </Button>
    )}
  </div>
);

export default EmptyState;
