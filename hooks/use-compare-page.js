"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { compareUtils } from "@/lib/utils";
import { getCarsByIds } from "@/actions/cars-listing";
import {
    computeDifferences,
    computeWinners,
    handleRemoveCar,
} from "@/app/(site)/compare/_components/utils";

export const useComparePage = () => {
    const [compareList, setCompareList] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    const fetchCars = useCallback(async () => {
        if (compareList.length === 0) {
            setCars([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await getCarsByIds(compareList);
            if (response.success) {
                setCars(response.data);
            } else {
                console.error("Error fetching cars:", response.error);
                setCars([]);
                setError(response.error || "Failed to load comparison data.");
            }
        } catch (err) {
            console.error("Error fetching cars:", err);
            setCars([]);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [compareList]);

    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    // ─── Derived data (memoised) ────────────────────────────────────────────

    const differences = useMemo(() => computeDifferences(cars), [cars]);
    const winners = useMemo(() => computeWinners(cars), [cars]);

    // ─── Handlers ───────────────────────────────────────────────────────────

    const clearAll = useCallback(() => {
        compareUtils.clearCompareList();
        window.dispatchEvent(new Event("compareListUpdated"));
    }, []);

    const removeCar = useCallback((carId) => {
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
            console.error("Share failed:", err);
            return { success: false, error: err.message };
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
        error,
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
