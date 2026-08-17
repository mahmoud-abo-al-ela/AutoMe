"use client";
import { logError } from "@/lib/utils/errors";

import { useState, useEffect, useCallback, useMemo } from "react";
import { compareUtils } from "@/lib/utils";
import { getCarsByIds } from "@/actions/cars-listing";
import {
    computeDifferences,
    computeWinners,
    handleRemoveCar,
} from "@/app/(site)/compare/_components/utils";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { SerializedCarWithImages } from "@/lib/utils/serializers";

export const useComparePage = () => {
    const [compareList, setCompareList] = useState<string[]>([]);
    const [highlightDifferences, setHighlightDifferences] = useState(false);
    const [activeCategory, setActiveCategory] = useState("basic");

    // ─── Sync compare list from localStorage ────────────────────────────────

    useEffect(() => {
        const list = compareUtils.getCompareList();
        setCompareList(list);

        const handleStorageChange = () => {
            const updatedList = compareUtils.getCompareList();
            setCompareList(updatedList);
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("compareListUpdated", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("compareListUpdated", handleStorageChange);
        };
    }, []);

    // ─── Fetch car data when compare list changes ───────────────────────────

    const { data: carsData, isLoading: loading, error, refetch: fetchCars } = useQuery({
        queryKey: queryKeys.compare.byIds(compareList),
        queryFn: () => getCarsByIds(compareList),
        enabled: compareList.length > 0,
        // serializeCarWithImages is nullable for callers that may pass nothing;
        // findCarsByIds only ever feeds it real rows.
        select: (res) => (res.success ? (res.data as SerializedCarWithImages[]) : []),
    });
    
    const cars = compareList.length === 0 ? [] : (carsData || []);

    // ─── Derived data (memoised) ────────────────────────────────────────────

    const differences = useMemo(() => computeDifferences(cars), [cars]);
    const winners = useMemo(() => computeWinners(cars), [cars]);

    // ─── Handlers ───────────────────────────────────────────────────────────

    const clearAll = useCallback(() => {
        compareUtils.clearCompareList();
        window.dispatchEvent(new Event("compareListUpdated"));
    }, []);

    const removeCar = useCallback((carId: string) => {
        handleRemoveCar(carId);
    }, []);

    const toggleHighlight = useCallback(() => {
        setHighlightDifferences((prev) => !prev);
    }, []);

    const shareComparison = useCallback(async () => {
        const url = window.location.href;

        try {
            // Try the native Web Share API first (mobile-friendly)
            if (navigator.share) {
                await navigator.share({
                    title: "Car Comparison",
                    text: "Check out this car comparison!",
                    url,
                });
                return { success: true, method: "share" };
            }

            // Fall back to clipboard copy
            await navigator.clipboard.writeText(url);
            return { success: true, method: "clipboard" };
        } catch (err) {
            // User cancelled share or clipboard failed
            logError("Share failed:", err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    }, []);

    const printComparison = useCallback(() => {
        window.print();
    }, []);

    const retry = useCallback(() => {
        fetchCars();
    }, [fetchCars]);

    // ─── Return shape ──────────────────────────────────────────────────────

    return {
        cars,
        loading,
        // The presenter renders this straight into a <p>. useQuery hands back an
        // Error instance, which React refuses to render as a child — so a failed
        // fetch blew up the error state itself. Surface the message instead.
        error: error ? error.message : null,
        hasCars: cars.length >= 2,
        singleCar: cars.length === 1 ? cars[0] : null,
        highlightDifferences,
        activeCategory,
        differences,
        winners,
        handlers: {
            clearAll,
            removeCar,
            toggleHighlight,
            setActiveCategory,
            shareComparison,
            printComparison,
            retry,
        },
    };
};
