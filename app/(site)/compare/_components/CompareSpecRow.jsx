"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_COMPARE_CARS } from "./utils";

const CompareSpecRow = ({
    label,
    specKey,
    cars,
    format,
    highlighted,
    isDifferent,
    winnerCarId,
    isEven,
}) => {
    const showHighlight = highlighted && isDifferent;
    const emptySlots = MAX_COMPARE_CARS - cars.length;

    return (
        <div
            className={cn(
                "grid grid-cols-[200px_1fr] md:grid-cols-[250px_1fr] border-b last:border-b-0 transition-colors duration-200",
                showHighlight && "bg-amber-50/60"
            )}
        >
            {/* Spec label */}
            <div
                className={cn(
                    "p-3 text-sm text-muted-foreground border-r flex items-center",
                    showHighlight
                        ? "bg-amber-50 border-l-2 border-l-amber-400"
                        : isEven
                            ? "bg-gray-50/80"
                            : "bg-gray-50"
                )}
            >
                {label}
            </div>

            {/* Values for each car — always 3 columns to match MAX_COMPARE_CARS */}
            <div className="grid grid-cols-3">
                {cars.map((car) => {
                    const rawValue = car[specKey];
                    const displayValue = format
                        ? format(rawValue)
                        : rawValue || "—";
                    const isWinner = winnerCarId === car.id;

                    return (
                        <div
                            key={`${car.id}-${specKey}`}
                            className={cn(
                                "p-3 text-sm border-r last:border-r-0 flex items-center gap-1.5 transition-colors duration-200",
                                showHighlight && "bg-amber-50/40",
                                isWinner && highlighted && "bg-emerald-50/60",
                                !showHighlight && !isWinner && isEven && "bg-white",
                                !showHighlight && !isWinner && !isEven && "bg-gray-50/30"
                            )}
                        >
                            {isWinner && highlighted && (
                                <Trophy className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                            )}
                            <span className={cn("font-medium", isWinner && highlighted && "text-emerald-700")}>
                                {displayValue}
                            </span>
                        </div>
                    );
                })}

                {/* Empty slots */}
                {Array.from({ length: emptySlots }).map((_, index) => (
                    <div
                        key={`empty-${specKey}-${index}`}
                        className="p-3 text-sm border-r last:border-r-0 text-muted-foreground bg-gray-50/50"
                    >
                        —
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompareSpecRow;
