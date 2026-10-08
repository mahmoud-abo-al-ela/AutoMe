"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealershipCarsSection } from "./DealershipCarsSection";
import { DealershipAbout } from "./DealershipAbout";
import { DealershipReviews } from "../../_components";
import type {
    DealershipDetail,
    DealershipInventoryProps,
    DealershipTab,
} from "../_lib/detail-types";

const trigger =
    "relative h-12 flex-none gap-2 rounded-none border-0 bg-transparent px-4 text-body font-semibold text-muted-foreground shadow-none cursor-pointer after:absolute after:inset-x-3 after:-bottom-px after:h-[3px] after:rounded-t-full after:bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-border-strong";

/** A count beside a tab's name; hidden at zero rather than showing "0". */
function Count({ value }: { value: number }) {
    const fmt = useFormatters();
    if (value <= 0) return null;
    return (
        <span className="rounded-full bg-muted px-2 text-micro font-semibold text-foreground">{fmt.number(value)}</span>
    );
}

/** Cars, Reviews and About. The page owns which one is open (`?tab=`). */
export const DealershipTabs = ({
    value,
    onValueChange,
    dealership,
    ...inventory
}: DealershipInventoryProps & {
    value: DealershipTab;
    onValueChange: (tab: DealershipTab) => void;
    dealership: DealershipDetail;
}) => {
    const t = useTranslations("dealerships.tabs");

    return (
        <Tabs value={value} onValueChange={(next) => onValueChange(next as DealershipTab)} className="w-full gap-0">
            <TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0 [scrollbar-width:none]">
                <TabsTrigger value="cars" className={trigger}>
                    {t("inventory")}
                    <Count value={dealership.carCount} />
                </TabsTrigger>
                <TabsTrigger value="reviews" className={trigger}>
                    {t("reviews")}
                    <Count value={dealership.totalReviews} />
                </TabsTrigger>
                <TabsTrigger value="about" className={trigger}>
                    {t("about")}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="cars" className="mt-0">
                <DealershipCarsSection carCount={dealership.carCount} {...inventory} />
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
                <DealershipReviews
                    organizationId={dealership.id}
                    organizationSlug={dealership.slug}
                    averageRating={dealership.averageRating}
                    totalReviews={dealership.totalReviews}
                />
            </TabsContent>

            <TabsContent value="about" className="mt-0">
                <DealershipAbout dealership={dealership} />
            </TabsContent>
        </Tabs>
    );
};
