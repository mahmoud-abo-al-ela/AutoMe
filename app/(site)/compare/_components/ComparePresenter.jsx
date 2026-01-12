"use client";

import { Button } from "@/components/ui/button";
import { EmptyCompare, CompareTable, MobileCompareTable } from "./index";
import { LoadingCard } from "@/components/common/LoadingStates";

export const ComparePresenter = ({
    cars,
    loading,
    isMobile,
    hasCars,
    singleCar,
    handlers,
}) => {
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
                ) : !hasCars ? (
                    <EmptyCompare singleCar={singleCar} />
                ) : (
                    <>
                        <div className="mb-3 sm:mb-4 flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlers.clearAll}
                                className="cursor-pointer text-xs sm:text-sm"
                            >
                                Clear All
                            </Button>
                        </div>

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
