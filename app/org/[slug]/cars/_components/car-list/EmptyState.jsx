import React from "react";
import { EmptyState as SharedEmptyState } from "@/components/common/EmptyState";
import { Car } from "lucide-react";

const EmptyState = ({ searchTerm, statusFilter, onClearFilters }) => {
  const isFiltered = searchTerm || statusFilter !== "all";

  return (
    <SharedEmptyState
      variant={isFiltered ? "filtered" : "inline"}
      icon={Car}
      title="No cars found"
      description={
        isFiltered
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Add your first car to start building your inventory."
      }
      onClearFilters={isFiltered ? onClearFilters : undefined}
    />
  );
};

export default EmptyState;
