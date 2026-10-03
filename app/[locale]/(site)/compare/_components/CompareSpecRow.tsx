"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_COMPARE_CARS } from "./utils";
import { useSpecValue } from "./use-spec-value";
import type { CompareCar, SpecKey } from "../_lib/compare-types";

const CompareSpecRow = ({
    label,
    specKey,
    cars,
    highlighted,
    isDifferent,
    winnerCarId,
    isEven,
}: {
    label: string;
    specKey: SpecKey;
    cars: CompareCar[];
    highlighted: boolean;
    isDifferent: boolean;
    winnerCarId: string | null;
    isEven: boolean;
}) => {
    const specValue = useSpecValue();
    const showHighlight = highlighted && isDifferent;
    const emptySlots = MAX_COMPARE_CARS - cars.length;

    return (
        <div
            className={cn(
                "grid grid-cols-[200px_1fr] md:grid-cols-[250px_1fr] border-b last:border-b-0 transition-colors duration-200",
                showHighlight && "bg-marker-soft/60"
            )}
        >
            {/* Spec label */}
            <div
                className={cn(
                    "p-3 text-sm text-muted-foreground border-e flex items-center",
                    showHighlight
                        ? "bg-marker-soft border-s-2 border-s-marker"
                        : isEven
                            ? "bg-muted/80"
                            : "bg-muted"
                )}
            >
                {label}
            </div>

            {/* Values for each car — always 3 columns to match MAX_COMPARE_CARS */}
            <div className="grid grid-cols-3">
                {cars.map((car) => {
                    const rawValue = car[specKey];
                    const displayValue = specValue(specKey, rawValue);
                    const isWinner = winnerCarId === car.id;

                    return (
                        <div
                            key={`${car.id}-${specKey}`}
                            className={cn(
                                "p-3 text-sm border-e last:border-e-0 flex items-center gap-1.5 transition-colors duration-200",
                                showHighlight && "bg-marker-soft/40",
                                isWinner && highlighted && "bg-positive-soft/60",
                                !showHighlight && !isWinner && isEven && "bg-card",
                                !showHighlight && !isWinner && !isEven && "bg-muted/30"
                            )}
                        >
                            {isWinner && highlighted && (
                                <Trophy className="h-3.5 w-3.5 text-positive flex-shrink-0" />
                            )}
                            <span className={cn("font-medium", isWinner && highlighted && "text-positive")}>
                                {displayValue}
                            </span>
                        </div>
                    );
                })}

                {/* Empty slots */}
                {Array.from({ length: emptySlots }).map((_, index) => (
                    <div
                        key={`empty-${specKey}-${index}`}
                        className="p-3 text-sm border-e last:border-e-0 text-muted-foreground bg-muted/50"
                    >
                        —
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompareSpecRow;
