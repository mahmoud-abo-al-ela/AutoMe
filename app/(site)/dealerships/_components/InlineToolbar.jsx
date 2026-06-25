"use client";

import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const RATING_CHIPS = [
    { label: "Any", value: undefined },
    { label: "4+ Stars", value: 4 },
    { label: "3+ Stars", value: 3 },
];

export const InlineToolbar = ({
    totalCount,
    filters,
    filterOptions,
    onRatingChange,
    onCityChange,
    onSortChange,
}) => {
    const sortValue = `${filters.sortBy}-${filters.sortOrder}`;

    const handleSortChange = (value) => {
        const [sortBy, sortOrder] = value.split("-");
        onSortChange(sortBy, sortOrder);
    };

    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Result count */}
            <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{totalCount}</span>{" "}
                {totalCount === 1 ? "dealership" : "dealerships"} found
            </p>

            {/* Rating chips + Sort */}
            <div className="flex flex-wrap items-center gap-3">
                {filterOptions?.cities?.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        {filterOptions.cities.slice(0, 5).map((city) => {
                            const isActive = filters.city === city;
                            return (
                                <Badge
                                    key={city}
                                    variant={isActive ? "default" : "outline"}
                                    className={`cursor-pointer select-none transition-colors ${isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                    onClick={() => onCityChange(city)}
                                >
                                    {city}
                                </Badge>
                            );
                        })}
                    </div>
                )}

                {/* Rating filter chips */}
                <div className="flex items-center gap-1.5">
                    {RATING_CHIPS.map((chip) => {
                        const isActive = filters.minRating === chip.value;
                        return (
                            <Badge
                                key={chip.label}
                                variant={isActive ? "default" : "outline"}
                                className={`cursor-pointer select-none transition-colors ${isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                onClick={() => onRatingChange(chip.value)}
                            >
                                {chip.value && (
                                    <Star className="h-3 w-3 fill-current" />
                                )}
                                {chip.label}
                            </Badge>
                        );
                    })}
                </div>

                {/* Sort dropdown */}
                <Select value={sortValue} onValueChange={handleSortChange}>
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterOptions?.sortByOptions?.map((option) => (
                            <SelectItem
                                key={`${option.value}-desc`}
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

export default InlineToolbar;
