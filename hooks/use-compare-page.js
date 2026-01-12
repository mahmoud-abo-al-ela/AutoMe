"use client";

import { useState, useEffect, useCallback } from "react";
import { compareUtils } from "@/lib/utils";
import { getCarsByIds } from "@/actions/cars-listing";

export const useComparePage = () => {
    const [compareList, setCompareList] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

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

    useEffect(() => {
        const fetchCars = async () => {
            if (compareList.length === 0) {
                setCars([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await getCarsByIds(compareList);
                if (response.success) {
                    setCars(response.data);
                } else {
                    console.error("Error fetching cars:", response.error);
                    setCars([]);
                }
            } catch (error) {
                console.error("Error fetching cars:", error);
                setCars([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCars();
    }, [compareList]);

    const clearAll = useCallback(() => {
        compareUtils.clearCompareList();
        window.dispatchEvent(new Event("compareListUpdated"));
    }, []);

    return {
        cars,
        loading,
        isMobile,
        hasCars: cars.length >= 2,
        singleCar: cars.length === 1 ? cars[0] : null,
        handlers: {
            clearAll,
        },
    };
};
