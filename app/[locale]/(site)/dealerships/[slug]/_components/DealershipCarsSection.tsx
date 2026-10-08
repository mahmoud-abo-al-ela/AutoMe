"use client";

import { Car, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import CarCard from "@/components/CarCard";
import { SiteEmptyState } from "@/components/brand";
import { Pagination } from "@/components/common/Pagination";
import { LoadingGrid } from "@/components/common/LoadingStates";
import { DealershipInventoryFilters } from "./DealershipInventoryFilters";
import type { DealershipInventoryProps } from "../_lib/detail-types";

/** The Cars tab: search and filters, the count and sort, then the grid. */
export const DealershipCarsSection = ({
    cars,
    carCount, // every car the dealership has for sale, whatever the filters
    carsLoading,
    carsPagination,
    onPageChange,
    filters,
    onFilterChange,
    availableFilters,
}: DealershipInventoryProps & { carCount: number }) => {
    const t = useTranslations("dealerships.inventory");

    if (carCount === 0) {
        return <SiteEmptyState icon={Car} title={t("noCarsTitle")} description={t("noCarsBody")} />;
    }

    return (
        <div className="flex flex-col gap-5">
            <DealershipInventoryFilters
                filters={filters}
                onFilterChange={onFilterChange}
                availableFilters={availableFilters}
                totalCars={carsPagination.total}
                isLoading={carsLoading}
            />

            {carsLoading ? (
                <LoadingGrid count={6} />
            ) : cars.length === 0 ? (
                <SiteEmptyState
                    icon={SearchX}
                    title={t("noMatchesTitle")}
                    description={t("noMatchesBody")}
                    primary={{ label: t("resetAllFilters"), onClick: () => onFilterChange({ sortBy: "newest" }) }}
                />
            ) : (
                <>
                    {/* The Browse grid: two-up on phones, three in the wide column. */}
                    <ul className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                        {cars.map((car, i) => (
                            <li key={car.id}>
                                <CarCard car={car} index={i} />
                            </li>
                        ))}
                    </ul>

                    {carsPagination.totalPages > 1 && (
                        <Pagination
                            currentPage={carsPagination.page}
                            totalPages={carsPagination.totalPages}
                            onPageChange={onPageChange}
                            disabled={carsLoading}
                        />
                    )}
                </>
            )}
        </div>
    );
};
