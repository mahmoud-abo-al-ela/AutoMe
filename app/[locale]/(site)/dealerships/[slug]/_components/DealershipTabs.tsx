"use client";

import { Car, MessageSquare, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { useFormatters } from "@/hooks/use-formatters";
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
    const t = useTranslations("dealerships.tabs");
    const fmt = useFormatters();

    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0 [scrollbar-width:none]">
                <TabsTrigger
                    value="inventory"
                    className="relative h-12 flex-none gap-2 rounded-none border-0 bg-transparent px-4 text-caption font-semibold text-muted-foreground shadow-none cursor-pointer after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-border-strong"
                >
                    <Car className="h-4 w-4" />
                    <span>{t("inventory")}</span>
                    {dealership.carCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="ms-1 h-5 min-w-5 px-1.5 text-micro font-semibold rounded-full"
                        >
                            {fmt.number(dealership.carCount)}
                        </Badge>
                    )}
                </TabsTrigger>

                <TabsTrigger
                    value="reviews"
                    className="relative h-12 flex-none gap-2 rounded-none border-0 bg-transparent px-4 text-caption font-semibold text-muted-foreground shadow-none cursor-pointer after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-border-strong"
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>{t("reviews")}</span>
                    {dealership.totalReviews > 0 && (
                        <Badge
                            variant="secondary"
                            className="ms-1 h-5 min-w-5 px-1.5 text-micro font-semibold rounded-full"
                        >
                            {fmt.number(dealership.totalReviews)}
                        </Badge>
                    )}
                </TabsTrigger>

                <TabsTrigger
                    value="about"
                    className="relative h-12 flex-none gap-2 rounded-none border-0 bg-transparent px-4 text-caption font-semibold text-muted-foreground shadow-none cursor-pointer after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-border-strong"
                >
                    <Info className="h-4 w-4" />
                    <span>{t("about")}</span>
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
                        {t("customerReviews", {
                            count: fmt.number(dealership.totalReviews),
                        })}
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
                    <div className="bg-card rounded-control border border-border p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {t("contactInformation")}
                        </h3>
                        <DealershipContactInfo dealership={dealership} />
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
};
