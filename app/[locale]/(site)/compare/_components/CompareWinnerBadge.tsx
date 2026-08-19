"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCarTitle } from "./utils";
import type { CompareCar, CompareWinners } from "../_lib/compare-types";

/**
 * Mapping of category IDs to the spec keys used for determining the winner,
 * and the logic for picking the best value.
 */
const CATEGORY_WINNER_RULES: Record<
    string,
    { keys: string[]; label: string }
> = {
    basic: {
        keys: ["price", "year"],
        label: "Best Value",
    },
    performance: {
        keys: ["mileage", "seats"],
        label: "Best Performance",
    },
    features: {
        keys: ["features"],
        label: "Most Features",
    },
};

/**
 * Small badge shown at the top of each category section indicating which car
 * "wins" that category based on aggregated spec winners.
 *
 * Auto-detects winner based on:
 *  - basic: Lowest price + newest year
 *  - performance: Lowest mileage + most seats
 *  - features: Most features
 *
 * Shows trophy icon with car name. Returns null if there's no clear winner.
 */
const CompareWinnerBadge = ({
    categoryId,
    cars,
    winners,
}: {
    categoryId: string;
    cars: CompareCar[];
    winners: CompareWinners;
}) => {
    const categoryWinner = useMemo(() => {
        const rules = CATEGORY_WINNER_RULES[categoryId];
        if (!rules || !winners) return null;

        // Count how many spec wins each car has in this category
        const winCounts: Record<string, number> = {};
        cars.forEach((car) => {
            winCounts[car.id] = 0;
        });

        rules.keys.forEach((key) => {
            const winnerId = winners[key];
            if (winnerId && winCounts[winnerId] !== undefined) {
                winCounts[winnerId]++;
            }
        });

        // Find the car with the most wins
        let bestId: string | null = null;
        let bestCount = 0;
        let hasTie = false;

        Object.entries(winCounts).forEach(([carId, count]) => {
            if (count > bestCount) {
                bestId = carId;
                bestCount = count;
                hasTie = false;
            } else if (count === bestCount && count > 0) {
                hasTie = true;
            }
        });

        // No winner if tied or no wins at all
        if (hasTie || bestCount === 0) return null;

        const winnerCar = cars.find((c) => c.id === bestId);
        if (!winnerCar) return null;

        return {
            car: winnerCar,
            label: rules.label,
        };
    }, [categoryId, cars, winners]);

    if (!categoryWinner) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                "bg-emerald-50 border border-emerald-200 text-emerald-700",
                "text-xs font-medium"
            )}
        >
            <Trophy className="h-3 w-3 text-emerald-600" />
            <span>{categoryWinner.label}:</span>
            <span className="font-semibold truncate max-w-[120px]">
                {getCarTitle(categoryWinner.car)}
            </span>
        </motion.div>
    );
};

export default CompareWinnerBadge;
