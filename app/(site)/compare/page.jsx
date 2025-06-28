"use client";

import { useEffect, useState } from "react";
import { compareUtils } from "@/lib/utils";
import { CompareTable, EmptyCompare, MobileCompareTable } from "./_components";
import { getCarsByIds } from "@/actions/cars-listing";
import { Button } from "@/components/ui/button";

const ComparePage = () => {
  const [compareList, setCompareList] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
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

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-10 sm:pb-16 md:pb-20">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mt-2">
            Car Comparison
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Compare up to 3 cars side by side to help you make the right
            decision
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8 text-center min-h-[40vh] sm:min-h-[50vh]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 bg-gray-200 rounded-full mb-3 md:mb-4"></div>
              <div className="h-4 sm:h-5 md:h-6 w-32 sm:w-40 md:w-48 bg-gray-200 rounded mb-3 md:mb-4"></div>
              <div className="h-3 sm:h-3.5 md:h-4 w-48 sm:w-56 md:w-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : cars.length < 2 ? (
          <EmptyCompare singleCar={cars.length === 1 ? cars[0] : null} />
        ) : (
          <>
            <div className="mb-3 sm:mb-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  compareUtils.clearCompareList();
                  window.dispatchEvent(new Event("compareListUpdated"));
                }}
                className="cursor-pointer text-xs sm:text-sm"
              >
                Clear All
              </Button>
            </div>

            {/* Show mobile table on small screens and desktop table on larger screens */}
            <div className="md:hidden">
              <MobileCompareTable cars={cars} />
            </div>
            <div className="hidden md:block">
              <CompareTable cars={cars} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
