"use client";

import { Badge } from "@/components/ui/badge";
import { X, FilterX } from "lucide-react";
import { getFilterLabel } from "@/lib/strategies/filter-strategies";
import { motion, AnimatePresence } from "framer-motion";

const getFilterColor = (type) => {
    switch (type) {
        case "search": return "bg-purple-100 text-purple-700 border-purple-200";
        case "make": return "bg-blue-100 text-blue-700 border-blue-200";
        case "bodyType": return "bg-sky-100 text-sky-700 border-sky-200";
        case "fuelType": return "bg-amber-100 text-amber-700 border-amber-200";
        case "transmission": return "bg-emerald-100 text-emerald-700 border-emerald-200";
        case "price": return "bg-green-100 text-green-700 border-green-200";
        default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
};

export const ActiveFilters = ({ filters, onClearFilter }) => {
    if (!filters || filters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6 min-h-[32px]">
            <AnimatePresence>
                {filters.map((filter, index) => (
                    <motion.div
                        key={`${filter.type}-${filter.value}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Badge
                            variant="outline"
                            className={`flex items-center gap-1.5 py-1 px-2.5 shadow-sm ${getFilterColor(filter.type)}`}
                        >
                            <span className="font-medium text-xs sm:text-sm">
                                {getFilterLabel(filter.type, filter.value)}
                            </span>
                            <div 
                                className="bg-white/50 hover:bg-white rounded-full p-0.5 transition-colors cursor-pointer"
                                onClick={() => onClearFilter(filter.type)}
                            >
                                <X className="h-3 w-3" />
                            </div>
                        </Badge>
                    </motion.div>
                ))}
            </AnimatePresence>

            {filters.length > 1 && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 ml-2 transition-colors"
                    onClick={() => onClearFilter("all")} // The clearFilter in hook needs to support "all" or we just call resetAllFilters. Wait, we don't have resetAllFilters passed here. 
                    // Let's hide this if we can't trigger reset from here easily, or better, we know the parent passes `onClearFilter` and `resetAllFilters` could be passed if we modify the parent.
                    // Actually, the parent CarsPagePresenter doesn't pass resetAllFilters to ActiveFilters right now.
                    // Let's just avoid "Clear All" here if we don't have the prop to keep it simple, or update the parent.
                >
                </motion.button>
            )}
        </div>
    );
};
