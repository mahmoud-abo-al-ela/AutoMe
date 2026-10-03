"use client";

import { useTranslations } from "next-intl";
import { Trophy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { specCategories } from "./utils";
import { useSpecValue } from "./use-spec-value";
import type {
  CompareCar,
  CompareDifferences,
  CompareWinners,
} from "../_lib/compare-types";

/**
 * Specs for a single active car (carousel mode).
 */
const SingleCarSpecs = ({
  car,
  cars,
  highlightDifferences,
  differences,
  winners,
}: {
  car: CompareCar;
  cars: CompareCar[];
  highlightDifferences: boolean;
  differences: CompareDifferences;
  winners: CompareWinners;
}) => {
    const t = useTranslations("compare");
    const tFields = useTranslations("carAttributes.fields");
    const specValue = useSpecValue();
  return (
    <div>
      {specCategories.map((category) => (
        <div key={category.id}>
          {/* Sticky category header */}
          <div className="sticky top-0 z-[5] px-3 py-2 bg-muted border-b text-xs font-semibold text-muted-foreground">
            {t(`sections.${category.id}`)}
          </div>
          <div className="divide-y">
            {category.specs.map((spec) => {
              const isDifferent = differences[spec.key] || false;
              const showHighlight = highlightDifferences && isDifferent;
              const isWinner = winners[spec.key] === car.id;
              const rawValue = car[spec.key];
              const displayValue = specValue(spec.key, rawValue);

              return (
                <div
                  key={spec.key}
                  className={cn(
                    "flex justify-between items-center px-3 py-2 text-xs transition-colors duration-200",
                    showHighlight && "bg-marker-soft/60 border-s-2 border-s-marker",
                    isWinner && highlightDifferences && "bg-positive-soft/60"
                  )}
                >
                  <span className="text-muted-foreground">{tFields(spec.key)}</span>
                  <span className="font-medium flex items-center gap-1">
                    {isWinner && highlightDifferences && (
                      <Trophy className="h-3 w-3 text-positive" />
                    )}
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Features */}
      <div>
        <div className="sticky top-0 z-[5] px-3 py-2 bg-muted border-b text-xs font-semibold text-muted-foreground">
          {t("features")}
        </div>
        {car.features && car.features.length > 0 ? (
          <div className="divide-y">
            {car.features.map((feature, idx) => {
              // Check if this feature is unique to this car or shared
              const otherCarsHave = cars
                .filter((c) => c.id !== car.id)
                .some((c) => (c.features || []).includes(feature));
              const isDifferent = !otherCarsHave;
              const showHighlight = highlightDifferences && isDifferent;

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs transition-colors duration-200",
                    showHighlight && "bg-marker-soft/60 border-s-2 border-s-marker"
                  )}
                >
                  <div className="h-4 w-4 rounded-full bg-positive-soft flex items-center justify-center flex-shrink-0">
                    <Check className="h-2.5 w-2.5 text-positive" />
                  </div>
                  <span>{feature}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            {t("noFeatures")}
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleCarSpecs;
