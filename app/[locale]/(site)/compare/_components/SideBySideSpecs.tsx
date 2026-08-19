"use client";

import { Trophy, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { specCategories } from "./utils";
import type {
  CompareCar,
  CompareDifferences,
  CompareWinners,
} from "../_lib/compare-types";

/**
 * Side-by-side specs for 2 cars.
 */
const SideBySideSpecs = ({
  cars,
  highlightDifferences,
  differences,
  winners,
}: {
  cars: CompareCar[];
  highlightDifferences: boolean;
  differences: CompareDifferences;
  winners: CompareWinners;
}) => {
  return (
    <div>
      {specCategories.map((category) => (
        <div key={category.id}>
          {/* Sticky category header */}
          <div className="sticky top-0 z-[5] px-3 py-2 bg-gray-100 border-b text-xs font-semibold text-muted-foreground">
            {category.title}
          </div>
          <div className="divide-y">
            {category.specs.map((spec) => {
              const isDifferent = differences[spec.key] || false;
              const showHighlight = highlightDifferences && isDifferent;

              return (
                <div
                  key={spec.key}
                  className={cn(
                    "transition-colors duration-200",
                    showHighlight && "bg-amber-50/60"
                  )}
                >
                  {/* Label row */}
                  <div
                    className={cn(
                      "px-3 pt-2 pb-0.5 text-[10px] text-muted-foreground",
                      showHighlight && "border-s-2 border-s-amber-400"
                    )}
                  >
                    {spec.label}
                  </div>
                  {/* Values row */}
                  <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                    {cars.map((car) => {
                      const rawValue = car[spec.key];
                      const displayValue = spec.format
                        ? spec.format(rawValue)
                        : rawValue || "—";
                      const isWinner = winners[spec.key] === car.id;

                      return (
                        <div
                          key={car.id}
                          className={cn(
                            "text-xs font-medium flex items-center gap-1 rounded px-1.5 py-0.5",
                            isWinner && highlightDifferences && "bg-emerald-50 text-emerald-700"
                          )}
                        >
                          {isWinner && highlightDifferences && (
                            <Trophy className="h-2.5 w-2.5 text-emerald-600 flex-shrink-0" />
                          )}
                          {displayValue}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Features side-by-side */}
      <div>
        <div className="sticky top-0 z-[5] px-3 py-2 bg-gray-100 border-b text-xs font-semibold text-muted-foreground">
          Features
        </div>
        <div className="divide-y">
          {(() => {
            const allFeatures = new Set<string>();
            cars.forEach((car) =>
              (car.features || []).forEach((f) => allFeatures.add(f))
            );
            const features = Array.from(allFeatures).sort();

            if (features.length === 0) {
              return (
                <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                  No features listed
                </div>
              );
            }

            return features.map((feature) => {
              const carHas = cars.map((car) =>
                (car.features || []).includes(feature)
              );
              const isDifferent = carHas.some((v) => v !== carHas[0]);
              const showHighlight = highlightDifferences && isDifferent;

              return (
                <div
                  key={feature}
                  className={cn(
                    "transition-colors duration-200",
                    showHighlight && "bg-amber-50/60"
                  )}
                >
                  <div
                    className={cn(
                      "px-3 pt-2 pb-0.5 text-[10px] text-muted-foreground line-clamp-1",
                      showHighlight && "border-s-2 border-s-amber-400"
                    )}
                  >
                    {feature}
                  </div>
                  <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                    {cars.map((car) => {
                      const has = (car.features || []).includes(feature);
                      return (
                        <div key={car.id} className="flex items-center gap-1">
                          {has ? (
                            <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center">
                              <Minus className="h-2.5 w-2.5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default SideBySideSpecs;
