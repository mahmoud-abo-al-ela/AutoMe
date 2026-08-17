"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Info, Gauge, ListChecks } from "lucide-react";
import { specCategories, MAX_COMPARE_CARS } from "./utils";
import CompareCarCard from "./CompareCarCard";
import AddCarSlot from "./AddCarSlot";
import CompareSpecRow from "./CompareSpecRow";
import CompareFeatureMatrix from "./CompareFeatureMatrix";
import CompareWinnerBadge from "./CompareWinnerBadge";
import type {
  CompareCar,
  CompareDifferences,
  CompareHandlers,
  CompareWinners,
} from "../_lib/compare-types";

/**
 * Icon map for category tabs.
 */
const CATEGORY_ICONS: Record<string, typeof Info> = {
  basic: Info,
  performance: Gauge,
  features: ListChecks,
};

/**
 * Desktop comparison table with:
 *  - Sticky top row of car cards
 *  - Tabbed spec categories (Basic / Performance / Features)
 *  - CompareSpecRow for each specification with diff highlighting
 *  - CompareFeatureMatrix for the features tab
 *  - CompareWinnerBadge per category
 *  - Framer-motion layout animations for adding/removing cars
 */
const CompareTable = ({
  cars,
  highlightDifferences,
  activeCategory,
  differences,
  winners,
  handlers,
}: {
  cars: CompareCar[];
  highlightDifferences: boolean;
  activeCategory: string;
  differences: CompareDifferences;
  winners: CompareWinners;
  handlers: CompareHandlers;
}) => {
  const emptySlots = MAX_COMPARE_CARS - cars.length;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* ── Sticky car cards row ──────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <motion.div
          layout
          className="grid grid-cols-3 gap-4 p-4"
        >
          <AnimatePresence mode="popLayout">
            {cars.map((car) => (
              <CompareCarCard
                key={car.id}
                car={car}
                onRemove={handlers.removeCar}
              />
            ))}
          </AnimatePresence>

          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <AddCarSlot key={`empty-${index}`} />
          ))}
        </motion.div>
      </div>

      {/* ── Tabbed spec sections ──────────────────────────────────────── */}
      <Tabs
        value={activeCategory}
        onValueChange={handlers.setActiveCategory}
        className="w-full"
      >
        <div className="border-b bg-gray-50/80 px-4 pt-3">
          <TabsList className="bg-transparent h-auto p-0 gap-1">
            {specCategories.map((category) => {
              const Icon = CATEGORY_ICONS[category.id] || Info;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-b-primary px-4 py-2 text-sm gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.title}
                </TabsTrigger>
              );
            })}
            {/* Features tab */}
            <TabsTrigger
              value="features"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-b-primary px-4 py-2 text-sm gap-1.5"
            >
              <ListChecks className="h-3.5 w-3.5" />
              Features
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Spec category tabs */}
        {specCategories.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="mt-0 focus-visible:outline-none focus-visible:ring-0"
          >
            {/* Winner badge */}
            <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-white border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {category.title}
              </h3>
              <CompareWinnerBadge
                categoryId={category.id}
                cars={cars}
                winners={winners}
              />
            </div>

            {/* Spec rows */}
            {category.specs.map((spec, index) => (
              <CompareSpecRow
                key={spec.key}
                label={spec.label}
                specKey={spec.key}
                cars={cars}
                format={spec.format}
                highlighted={highlightDifferences}
                isDifferent={differences[spec.key] || false}
                winnerCarId={winners[spec.key] || null}
                isEven={index % 2 === 0}
              />
            ))}
          </TabsContent>
        ))}

        {/* Features tab */}
        <TabsContent
          value="features"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          {/* Winner badge */}
          <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-white border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Features Comparison
            </h3>
            <CompareWinnerBadge
              categoryId="features"
              cars={cars}
              winners={winners}
            />
          </div>

          <CompareFeatureMatrix
            cars={cars}
            highlighted={highlightDifferences}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompareTable;
