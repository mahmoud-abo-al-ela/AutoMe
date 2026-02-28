"use client";

import { useState } from "react";
import { Star, Filter as FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const DealershipFilterPanel = ({
    filters,
    filterOptions,
    onFilterChange,
    isLoading,
}) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key, value) => {
        const newFilters = {
            ...localFilters,
            [key]: value,
        };
        setLocalFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleRatingChange = (rating) => {
        const newRating =
            localFilters.minRating === rating ? undefined : rating;
        handleFilterChange("minRating", newRating);
    };

    const handlePlanTypeChange = (planType) => {
        const newPlanType =
            localFilters.planType === planType ? undefined : planType;
        handleFilterChange("planType", newPlanType);
    };

    const handleSortChange = (value) => {
        const [sortBy, sortOrder] = value.split("-");
        handleFilterChange("sortBy", sortBy);
        handleFilterChange("sortOrder", sortOrder);
    };

    const clearAllFilters = () => {
        const clearedFilters = {
            search: "",
            planType: undefined,
            minRating: undefined,
            sortBy: "rating",
            sortOrder: "desc",
        };
        setLocalFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    const hasActiveFilters =
        localFilters.planType ||
        localFilters.minRating;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FilterIcon className="h-5 w-5" />
                    Filters
                </h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* Plan Type Filter */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Plan Type</label>
                <div className="flex flex-wrap gap-2">
                    {filterOptions?.planTypes?.map((planType) => (
                        <Badge
                            key={planType}
                            variant={localFilters.planType === planType ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${localFilters.planType === planType
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-gray-100"
                                }`}
                            onClick={() => handlePlanTypeChange(planType)}
                        >
                            {planType}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Rating</label>
                <div className="flex flex-wrap gap-2">
                    {filterOptions?.ratingRanges?.map((range) => (
                        <Badge
                            key={range.value}
                            variant={
                                localFilters.minRating === range.value ? "default" : "outline"
                            }
                            className={`cursor-pointer transition-colors flex items-center gap-1 ${localFilters.minRating === range.value
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-gray-100"
                                }`}
                            onClick={() => handleRatingChange(range.value)}
                        >
                            <Star className="h-3 w-3 fill-current" />
                            {range.label}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select
                    value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
                    onValueChange={handleSortChange}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {filterOptions?.sortByOptions?.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={`${option.value}-desc`}
                            >
                                {option.label} (High to Low)
                            </SelectItem>
                        ))}
                        {filterOptions?.sortByOptions?.map((option) => (
                            <SelectItem
                                key={`${option.value}-asc`}
                                value={`${option.value}-asc`}
                            >
                                {option.label} (Low to High)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default DealershipFilterPanel;
