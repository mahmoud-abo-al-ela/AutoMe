"use client";

import { useMemo } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_COMPARE_CARS } from "./utils";
import type { CompareCar } from "../_lib/compare-types";

const CompareFeatureMatrix = ({
    cars,
    highlighted,
}: {
    cars: CompareCar[];
    highlighted: boolean;
}) => {
    // Collect all unique features across all cars
    const allFeatures = useMemo(() => {
        const featureSet = new Set<string>();
        cars.forEach((car) => {
            (car.features || []).forEach((feature) => featureSet.add(feature));
        });
        return Array.from(featureSet).sort();
    }, [cars]);

    // Build a lookup: car.id → Set of features
    const carFeatureSets = useMemo(() => {
        const map: Record<string, Set<string>> = {};
        cars.forEach((car) => {
            map[car.id] = new Set(car.features || []);
        });
        return map;
    }, [cars]);

    const emptySlots = MAX_COMPARE_CARS - cars.length;

    if (allFeatures.length === 0) {
        return (
            <div className="grid grid-cols-[200px_1fr] md:grid-cols-[250px_1fr] border-b">
                <div className="p-3 text-sm text-muted-foreground border-r bg-gray-50">
                    Features
                </div>
                <div className="grid grid-cols-3">
                    <div className="p-3 text-sm text-muted-foreground col-span-3 text-center">
                        No features listed for any car
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {allFeatures.map((feature, index) => {
                // Check if this feature differs across cars
                const hasFeature = cars.map((car) =>
                    carFeatureSets[car.id]?.has(feature)
                );
                const isDifferent = hasFeature.some((v) => v !== hasFeature[0]);
                const showHighlight = highlighted && isDifferent;
                const isEven = index % 2 === 0;

                return (
                    <div
                        key={feature}
                        className={cn(
                            "grid grid-cols-[200px_1fr] md:grid-cols-[250px_1fr] border-b last:border-b-0 transition-colors duration-200",
                            showHighlight && "bg-amber-50/60"
                        )}
                    >
                        {/* Feature label */}
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
                            <span className="line-clamp-1">{feature}</span>
                        </div>

                        {/* Checkmark / dash per car */}
                        <div className="grid grid-cols-3">
                            {cars.map((car) => {
                                const has = carFeatureSets[car.id]?.has(feature);
                                return (
                                    <div
                                        key={`${car.id}-${feature}`}
                                        className={cn(
                                            "p-3 text-sm border-r last:border-r-0 flex items-center justify-center transition-colors duration-200",
                                            showHighlight && "bg-amber-50/40",
                                            !showHighlight && isEven && "bg-white",
                                            !showHighlight && !isEven && "bg-gray-50/30"
                                        )}
                                    >
                                        {has ? (
                                            <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Check className="h-3 w-3 text-emerald-600" />
                                            </div>
                                        ) : (
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Minus className="h-3 w-3 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Empty slots */}
                            {Array.from({ length: emptySlots }).map((_, i) => (
                                <div
                                    key={`empty-feature-${feature}-${i}`}
                                    className="p-3 text-sm border-r last:border-r-0 text-muted-foreground bg-gray-50/50 flex items-center justify-center"
                                >
                                    <Minus className="h-3 w-3 text-gray-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CompareFeatureMatrix;
