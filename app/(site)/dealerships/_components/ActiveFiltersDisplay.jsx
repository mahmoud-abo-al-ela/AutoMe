import { Button } from "@/components/ui/button";

export const ActiveFiltersDisplay = ({ filters, onResetFilters }) => {
    const hasActiveFilters =
        filters.planType ||
        filters.minRating ||
        filters.search;

    if (!hasActiveFilters) {
        return null;
    }

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.search && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Search: "{filters.search}"
                </span>
            )}
            {filters.planType && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Plan: {filters.planType}
                </span>
            )}
            {filters.minRating && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Rating: {filters.minRating}+ stars
                </span>
            )}
            <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="text-xs h-6"
            >
                Clear all
            </Button>
        </div>
    );
};
