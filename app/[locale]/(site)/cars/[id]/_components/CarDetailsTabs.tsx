"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CarDescription from "./CarDescription";
import CarFeatures from "./CarFeatures";
import CarSpecifications from "./CarSpecifications";
import type { CarDetail } from "../_lib/car-detail-types";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { resolveCarFeatures } from "@/lib/utils/car-text";
import { useFormatters } from "@/hooks/use-formatters";

const TRIGGER =
  "relative h-12 flex-none rounded-none border-0 bg-transparent px-4 text-caption font-semibold text-muted-foreground shadow-none " +
  "after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-transparent " +
  "hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-border-strong";

/**
 * Description / Features / All specs (Figma: Tabs). Underline tabs on a
 * hairline; the six key specs already sit above, under the gallery, so the
 * tabs hold the long-form detail.
 */
const CarDetailsTabs = ({ car }: { car: CarDetail }) => {
  const t = useTranslations("carDetail.tabs");
  const fmt = useFormatters();
  const features = resolveCarFeatures(car, useLocale() as Locale);
  const hasFeatures = features.features.length > 0;

  return (
    <Tabs defaultValue="description" className="w-full gap-0 rounded-control border border-border bg-card">
      <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none rounded-t-control border-b border-border bg-transparent p-0 px-2 [scrollbar-width:none]">
        <TabsTrigger value="description" className={TRIGGER}>
          {t("description")}
        </TabsTrigger>
        {hasFeatures && (
          <TabsTrigger value="features" className={TRIGGER}>
            {t("features")}
            <span className="ms-1.5 rounded-full bg-muted px-1.5 text-micro tabular-nums">
              {fmt.number(features.features.length)}
            </span>
          </TabsTrigger>
        )}
        <TabsTrigger value="specifications" className={TRIGGER}>
          {t("specifications")}
        </TabsTrigger>
      </TabsList>

      <div className="p-5 sm:p-6">
        <TabsContent value="description" className="mt-0">
          <CarDescription car={car} />
        </TabsContent>
        {hasFeatures && (
          <TabsContent value="features" className="mt-0">
            <CarFeatures resolved={features} />
          </TabsContent>
        )}
        <TabsContent value="specifications" className="mt-0">
          <CarSpecifications car={car} variant="full" />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default CarDetailsTabs;
