import { Filter as FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DealershipFilterPanel } from "./DealershipFilterPanel";

export const MobileFilterButton = ({
    isOpen,
    onOpenChange,
    filters,
    filterOptions,
    onFilterChange,
    loading,
}) => {
    const hasActiveFilters =
        filters.planType ||
        filters.minRating ||
        filters.search;

    return (
        <div className="lg:hidden mb-4">
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <FilterIcon className="h-4 w-4" />
                        <span>
                            Filters {hasActiveFilters && `(active)`}
                        </span>
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="left"
                    className="w-[85%] sm:w-[350px] p-0 overflow-y-auto"
                >
                    <div className="p-4 pb-24">
                        {filterOptions && (
                            <DealershipFilterPanel
                                filters={filters}
                                filterOptions={filterOptions}
                                onFilterChange={onFilterChange}
                                isLoading={loading}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};
