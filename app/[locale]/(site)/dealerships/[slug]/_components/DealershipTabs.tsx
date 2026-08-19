"use client";

import { Car, MessageSquare, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { DealershipCarsSection } from "./DealershipCarsSection";
import { DealershipWorkingHours } from "./DealershipWorkingHours";
import { DealershipContactInfo } from "./DealershipContactInfo";
import { DealershipReviews } from "../../_components";
import type {
    DealershipDetail,
    DealershipInventoryProps,
} from "../_lib/detail-types";

export const DealershipTabs = ({
    dealership,
    cars,
    carsLoading,
    carsPagination,
    onPageChange,
    defaultTab = "inventory",
    filters,
    onFilterChange,
    availableFilters,
}: DealershipInventoryProps & {
    dealership: DealershipDetail;
    defaultTab?: string;
}) => {
    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full sm:w-auto h-auto p-1 bg-muted/60 rounded-xl mb-6">
                <TabsTrigger
                    value="inventory"
                    className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
                >
                    <Car className="h-4 w-4" />
                    <span>Inventory</span>
                    {dealership.carCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-1 h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full"
                        >
                            {dealership.carCount}
                        </Badge>
                    )}
                </TabsTrigger>

                <TabsTrigger
                    value="reviews"
                    className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>Reviews</span>
                    {dealership.totalReviews > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-1 h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full"
                        >
                            {dealership.totalReviews}
                        </Badge>
                    )}
                </TabsTrigger>

                <TabsTrigger
                    value="about"
                    className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
                >
                    <Info className="h-4 w-4" />
                    <span>About</span>
                </TabsTrigger>
            </TabsList>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="mt-0">
                <div id="dealership-inventory">
                    <DealershipCarsSection
                        cars={cars}
                        carCount={dealership.carCount}
                        carsLoading={carsLoading}
                        carsPagination={carsPagination}
                        onPageChange={onPageChange}
                        filters={filters}
                        onFilterChange={onFilterChange}
                        availableFilters={availableFilters}
                    />
                </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-0">
                <div id="dealership-reviews">
                    <h2 className="text-2xl font-bold mb-6">
                        Customer Reviews ({dealership.totalReviews})
                    </h2>
                    <DealershipReviews organizationId={dealership.id} />
                </div>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="mt-0">
                <div className="space-y-6">
                    {/* Working Hours */}
                    <DealershipWorkingHours
                        workingHours={dealership.workingHours}
                    />

                    {/* Contact Information */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Contact Information
                        </h3>
                        <DealershipContactInfo dealership={dealership} />
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
};
