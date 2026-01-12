"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { getFilterLabel } from "@/lib/strategies/filter-strategies";

export const ActiveFilters = ({ filters, onClearFilter }) => {
    if (!filters || filters.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-6">
            {filters.map((filter, index) => (
                <Badge
                    key={index}
                    variant="outline"
                    className="bg-primary/5 flex items-center gap-1 py-1 px-2"
                >
                    {getFilterLabel(filter.type, filter.value)}
                    <X
                        className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                        onClick={() => onClearFilter(filter.type)}
                    />
                </Badge>
            ))}
        </div>
    );
};
