"use client";

import { useState } from "react";
import { getDealershipCars } from "@/actions/dealerships";
import { BuyerTargetProvider } from "@/components/BuyerAccess";
import { DealershipIdentity } from "./DealershipIdentity";
import { VisitCard } from "./VisitCard";
import { DealershipTabs } from "./DealershipTabs";
import {
    DEALERSHIP_CARS_PER_PAGE,
    type DealershipCar,
    type DealershipCarFilterOptions,
    type DealershipCarsPagination,
    type DealershipDetail,
    type DealershipInventoryFilterState,
    type DealershipTab,
} from "../_lib/detail-types";

/**
 * A dealership's storefront (round 1, direction A: storefront and visit card).
 * Who they are across the top; the cars, reviews and about tabs in the main
 * column; beside them a visit card that stays in view — open now, message,
 * call, directions, the terms. On phones the card comes first, so the
 * actions sit above the tabs.
 *
 * The server renders the first page of cars; filtering and paging fetch here.
 */
export function DealershipPage({
    dealership,
    initialCars,
    initialPagination,
    filterOptions,
    initialTab,
}: {
    dealership: DealershipDetail;
    initialCars: DealershipCar[];
    initialPagination: DealershipCarsPagination;
    filterOptions: DealershipCarFilterOptions;
    initialTab: DealershipTab;
}) {
    const [tab, setTab] = useState<DealershipTab>(initialTab);
    const [cars, setCars] = useState(initialCars);
    const [carsPagination, setCarsPagination] = useState(initialPagination);
    const [carsLoading, setCarsLoading] = useState(false);
    const [filters, setFilters] = useState<DealershipInventoryFilterState>({ sortBy: "newest" });

    const changeTab = (next: DealershipTab) => {
        setTab(next);
        // In the address, so a tab can be shared or reloaded; replaced, not
        // pushed, so Back leaves the page rather than stepping through tabs.
        const url = new URL(window.location.href);
        if (next === "cars") url.searchParams.delete("tab");
        else url.searchParams.set("tab", next);
        window.history.replaceState(null, "", url);
    };

    const fetchCars = async (nextFilters: DealershipInventoryFilterState, page: number) => {
        setCarsLoading(true);
        try {
            const response = await getDealershipCars(dealership.id, nextFilters, {
                page,
                limit: DEALERSHIP_CARS_PER_PAGE,
            });
            if (response.success) {
                setCars(response.data.cars.filter((car): car is DealershipCar => car !== null));
                setCarsPagination(response.data.pagination);
            }
        } catch (error) {
            console.error("Error fetching cars:", error);
        } finally {
            setCarsLoading(false);
        }
    };

    const handleFilterChange = (nextFilters: DealershipInventoryFilterState) => {
        setFilters(nextFilters);
        fetchCars(nextFilters, 1);
    };

    const handlePageChange = (page: number) => {
        fetchCars(filters, page);
        document.getElementById("dealership-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // The message dialog lists the dealership's newest cars as the server
    // sent them, whatever the inventory filters are set to now.
    const showAllCars = () => {
        changeTab("cars");
        document.getElementById("dealership-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <BuyerTargetProvider
            target={{ organizationId: dealership.id, organizationSlug: dealership.slug }}
        >
            <div className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-4 sm:px-6 md:pt-6 xl:px-0">
                <DealershipIdentity dealership={dealership} />

                <div className="mt-6 grid items-start gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
                    <VisitCard
                        dealership={dealership}
                        newestCars={initialCars}
                        onShowAllCars={showAllCars}
                        compact={tab === "about"}
                        className="lg:sticky lg:top-[96px] lg:col-start-2 lg:row-start-1"
                    />
                    <div id="dealership-tabs" className="min-w-0 scroll-mt-24 lg:col-start-1 lg:row-start-1">
                        <DealershipTabs
                            value={tab}
                            onValueChange={changeTab}
                            dealership={dealership}
                            cars={cars}
                            carsLoading={carsLoading}
                            carsPagination={carsPagination}
                            onPageChange={handlePageChange}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            availableFilters={filterOptions}
                        />
                    </div>
                </div>
            </div>
        </BuyerTargetProvider>
    );
}
