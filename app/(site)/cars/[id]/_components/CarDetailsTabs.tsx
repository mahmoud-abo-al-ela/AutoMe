"use client";

import { Info, Award, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import CarDescription from "./CarDescription";
import CarFeatures from "./CarFeatures";
import CarSpecifications from "./CarSpecifications";
import type { CarDetail } from "../_lib/car-detail-types";

const CarDetailsTabs = ({ car }: { car: CarDetail }) => {
    const hasFeatures = car.features && car.features.length > 0;

    return (
        <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full sm:w-auto h-auto p-1 bg-muted/60 rounded-xl mb-4 sm:mb-6 overflow-x-auto">
                <TabsTrigger
                    value="description"
                    className="gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer text-sm"
                >
                    <Info className="h-4 w-4" />
                    <span>Description</span>
                </TabsTrigger>

                {hasFeatures && (
                    <TabsTrigger
                        value="features"
                        className="gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer text-sm"
                    >
                        <Award className="h-4 w-4" />
                        <span>Features</span>
                        <Badge
                            variant="secondary"
                            className="ml-1 h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full"
                        >
                            {car.features.length}
                        </Badge>
                    </TabsTrigger>
                )}

                <TabsTrigger
                    value="specifications"
                    className="gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer text-sm"
                >
                    <Settings2 className="h-4 w-4" />
                    <span>Specifications</span>
                </TabsTrigger>
            </TabsList>

            {/* Description Tab */}
            <TabsContent value="description" className="mt-0">
                <CarDescription description={car.description} />
            </TabsContent>

            {/* Features Tab */}
            {hasFeatures && (
                <TabsContent value="features" className="mt-0">
                    <CarFeatures features={car.features} />
                </TabsContent>
            )}

            {/* Specifications Tab */}
            <TabsContent value="specifications" className="mt-0">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-6 md:p-8">
                    <CarSpecifications car={car} variant="full" />
                </div>
            </TabsContent>
        </Tabs>
    );
};

export default CarDetailsTabs;
