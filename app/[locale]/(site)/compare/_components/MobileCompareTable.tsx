"use client";

import { useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Columns2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCarTitle, MAX_COMPARE_CARS } from "./utils";
import MobileCarCard from "./MobileCarCard";
import SingleCarSpecs from "./SingleCarSpecs";
import SideBySideSpecs from "./SideBySideSpecs";
import type {
  CompareCar,
  CompareDifferences,
  CompareHandlers,
  CompareWinners,
} from "../_lib/compare-types";

/**
 * Mobile comparison view with:
 *  - Swipeable car cards carousel at the top (Embla)
 *  - Specs displayed below for the active car
 *  - "Compare Side by Side" toggle for compact 2-car view
 *  - Sticky spec category headers
 *  - Swipe indicator dots synced with carousel
 */
const MobileCompareTable = ({
  cars,
  highlightDifferences,
  differences,
  winners,
  handlers,
}: {
  cars: CompareCar[];
  highlightDifferences: boolean;
  differences: CompareDifferences;
  winners: CompareWinners;
  handlers: CompareHandlers;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sideBySide, setSideBySide] = useState(false);
  const [api, setApi] = useState<CarouselApi>(undefined);

  // Sync carousel index
  const onSelect = useCallback(() => {
    if (!api) return;
    setActiveIndex(api.selectedScrollSnap());
  }, [api]);

  // Set up carousel event listener
  const handleApiChange = useCallback(
    (emblaApi: CarouselApi) => {
      setApi(emblaApi);
      if (emblaApi) {
        emblaApi.on("select", onSelect);
        onSelect();
      }
    },
    [onSelect]
  );

  const activeCar = cars[activeIndex] || cars[0];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* ── Side-by-side toggle ────────────────────────────────────────── */}
      {cars.length >= 2 && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/80">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground">
            <Columns2 className="h-3.5 w-3.5" />
            <span>Side by Side</span>
            <Switch
              checked={sideBySide}
              onCheckedChange={setSideBySide}
              className="scale-75"
            />
          </label>
          {/* Dot indicators */}
          {!sideBySide && (
            <div className="flex items-center gap-1.5">
              {cars.map((car, i) => (
                <button
                  key={car.id}
                  onClick={() => api?.scrollTo(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-200",
                    i === activeIndex
                      ? "bg-primary w-4"
                      : "bg-gray-300"
                  )}
                  aria-label={`Go to ${getCarTitle(car)}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Carousel / Side-by-side car cards ──────────────────────────── */}
      <AnimatePresence mode="wait">
        {sideBySide ? (
          <motion.div
            key="side-by-side"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-2 p-3"
          >
            {cars.map((car) => (
              <MobileCarCard
                key={car.id}
                car={car}
                compact
                onRemove={handlers.removeCar}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="carousel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Carousel
              setApi={handleApiChange}
              opts={{ align: "start", loop: false }}
              className="w-full"
            >
              <CarouselContent className="-ms-2">
                {cars.map((car) => (
                  <CarouselItem key={car.id} className="ps-2 basis-[85%]">
                    <MobileCarCard
                      car={car}
                      onRemove={handlers.removeCar}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {cars.length > 1 && (
                <>
                  <CarouselPrevious className="start-1 h-7 w-7" />
                  <CarouselNext className="end-1 h-7 w-7" />
                </>
              )}
            </Carousel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Specs section ──────────────────────────────────────────────── */}
      <div className="border-t">
        {sideBySide ? (
          <SideBySideSpecs
            cars={cars}
            highlightDifferences={highlightDifferences}
            differences={differences}
            winners={winners}
          />
        ) : (
          <SingleCarSpecs
            car={activeCar}
            cars={cars}
            highlightDifferences={highlightDifferences}
            differences={differences}
            winners={winners}
          />
        )}
      </div>

      {/* ── Add more cars prompt ───────────────────────────────────────── */}
      {cars.length < MAX_COMPARE_CARS && (
        <div className="p-4 flex flex-col items-center justify-center bg-gray-50 text-center border-t">
          <p className="text-muted-foreground text-xs mb-2">
            Add {MAX_COMPARE_CARS - cars.length} more{" "}
            {MAX_COMPARE_CARS - cars.length === 1 ? "car" : "cars"} to compare
          </p>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/cars">Browse Cars</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default MobileCompareTable;
