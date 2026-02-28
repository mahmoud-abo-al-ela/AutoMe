"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  X,
  ArrowRight,
  Columns2,
  Trophy,
  Check,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  specCategories,
  formatPrice,
  formatMileage,
  getCarTitle,
  MAX_COMPARE_CARS,
} from "./utils";

/**
 * Mobile comparison view with:
 *  - Swipeable car cards carousel at the top (Embla)
 *  - Specs displayed below for the active car
 *  - "Compare Side by Side" toggle for compact 2-car view
 *  - Sticky spec category headers
 *  - Swipe indicator dots synced with carousel
 *
 * @param {Object}  props
 * @param {Array}   props.cars                 - Array of car objects
 * @param {boolean} props.highlightDifferences - Whether to highlight diffs
 * @param {Object}  props.differences          - Map of spec key → boolean
 * @param {Object}  props.winners              - Map of spec key → winning car ID
 * @param {Object}  props.handlers             - Handler functions from hook
 */
const MobileCompareTable = ({
  cars,
  highlightDifferences,
  differences,
  winners,
  handlers,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sideBySide, setSideBySide] = useState(false);
  const [api, setApi] = useState(null);

  // Sync carousel index
  const onSelect = useCallback(() => {
    if (!api) return;
    setActiveIndex(api.selectedScrollSnap());
  }, [api]);

  // Set up carousel event listener
  const handleApiChange = useCallback(
    (emblaApi) => {
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
              <CarouselContent className="-ml-2">
                {cars.map((car) => (
                  <CarouselItem key={car.id} className="pl-2 basis-[85%]">
                    <MobileCarCard
                      car={car}
                      onRemove={handlers.removeCar}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {cars.length > 1 && (
                <>
                  <CarouselPrevious className="left-1 h-7 w-7" />
                  <CarouselNext className="right-1 h-7 w-7" />
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

// ─── Sub-components ────────────────────────────────────────────────────────

/**
 * Mobile car card used in both carousel and side-by-side modes.
 */
const MobileCarCard = ({ car, compact = false, onRemove }) => {
  return (
    <div className={cn("relative p-3", compact && "p-2")}>
      <Button
        onClick={() => onRemove(car.id)}
        size="icon"
        variant="ghost"
        className="absolute top-1 right-1 z-10 h-6 w-6 bg-white/80 backdrop-blur-sm rounded-full hover:bg-red-50 hover:text-red-600 cursor-pointer shadow-sm"
        aria-label={`Remove ${getCarTitle(car)}`}
      >
        <X className="h-3 w-3" />
      </Button>

      <div className={cn("flex gap-3", compact && "flex-col gap-2")}>
        <div className={cn("relative", compact ? "w-full aspect-[16/9]" : "w-1/3 aspect-[4/3]")}>
          <Image
            src={car.images[0]?.url}
            alt={getCarTitle(car)}
            fill
            className="object-cover rounded-md"
          />
        </div>
        <div className={cn(compact ? "w-full" : "w-2/3")}>
          <h3 className={cn("font-semibold mb-1 line-clamp-1", compact ? "text-xs" : "text-sm")}>
            {getCarTitle(car)}
          </h3>
          <div className="flex items-center gap-1.5 mb-2">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-[10px] px-1.5 py-0">
              {formatPrice(car.price)}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {car.year}
            </Badge>
          </div>
          {!compact && (
            <Button asChild size="sm" className="w-full text-xs h-7">
              <Link href={`/cars/${car.id}`}>
                View Details
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Specs for a single active car (carousel mode).
 */
const SingleCarSpecs = ({ car, cars, highlightDifferences, differences, winners }) => {
  return (
    <div>
      {specCategories.map((category) => (
        <div key={category.id}>
          {/* Sticky category header */}
          <div className="sticky top-0 z-[5] px-3 py-2 bg-gray-100 border-b text-xs font-semibold text-muted-foreground">
            {category.title}
          </div>
          <div className="divide-y">
            {category.specs.map((spec) => {
              const isDifferent = differences[spec.key] || false;
              const showHighlight = highlightDifferences && isDifferent;
              const isWinner = winners[spec.key] === car.id;
              const rawValue = car[spec.key];
              const displayValue = spec.format ? spec.format(rawValue) : rawValue || "—";

              return (
                <div
                  key={spec.key}
                  className={cn(
                    "flex justify-between items-center px-3 py-2 text-xs transition-colors duration-200",
                    showHighlight && "bg-amber-50/60 border-l-2 border-l-amber-400",
                    isWinner && highlightDifferences && "bg-emerald-50/60"
                  )}
                >
                  <span className="text-muted-foreground">{spec.label}</span>
                  <span className="font-medium flex items-center gap-1">
                    {isWinner && highlightDifferences && (
                      <Trophy className="h-3 w-3 text-emerald-600" />
                    )}
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Features */}
      <div>
        <div className="sticky top-0 z-[5] px-3 py-2 bg-gray-100 border-b text-xs font-semibold text-muted-foreground">
          Features
        </div>
        {car.features && car.features.length > 0 ? (
          <div className="divide-y">
            {car.features.map((feature, idx) => {
              // Check if this feature is unique to this car or shared
              const otherCarsHave = cars
                .filter((c) => c.id !== car.id)
                .some((c) => (c.features || []).includes(feature));
              const isDifferent = !otherCarsHave;
              const showHighlight = highlightDifferences && isDifferent;

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs transition-colors duration-200",
                    showHighlight && "bg-amber-50/60 border-l-2 border-l-amber-400"
                  )}
                >
                  <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-2.5 w-2.5 text-emerald-600" />
                  </div>
                  <span>{feature}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            No features listed
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Side-by-side specs for 2 cars.
 */
const SideBySideSpecs = ({ cars, highlightDifferences, differences, winners }) => {
  return (
    <div>
      {specCategories.map((category) => (
        <div key={category.id}>
          {/* Sticky category header */}
          <div className="sticky top-0 z-[5] px-3 py-2 bg-gray-100 border-b text-xs font-semibold text-muted-foreground">
            {category.title}
          </div>
          <div className="divide-y">
            {category.specs.map((spec) => {
              const isDifferent = differences[spec.key] || false;
              const showHighlight = highlightDifferences && isDifferent;

              return (
                <div
                  key={spec.key}
                  className={cn(
                    "transition-colors duration-200",
                    showHighlight && "bg-amber-50/60"
                  )}
                >
                  {/* Label row */}
                  <div
                    className={cn(
                      "px-3 pt-2 pb-0.5 text-[10px] text-muted-foreground",
                      showHighlight && "border-l-2 border-l-amber-400"
                    )}
                  >
                    {spec.label}
                  </div>
                  {/* Values row */}
                  <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                    {cars.map((car) => {
                      const rawValue = car[spec.key];
                      const displayValue = spec.format
                        ? spec.format(rawValue)
                        : rawValue || "—";
                      const isWinner = winners[spec.key] === car.id;

                      return (
                        <div
                          key={car.id}
                          className={cn(
                            "text-xs font-medium flex items-center gap-1 rounded px-1.5 py-0.5",
                            isWinner && highlightDifferences && "bg-emerald-50 text-emerald-700"
                          )}
                        >
                          {isWinner && highlightDifferences && (
                            <Trophy className="h-2.5 w-2.5 text-emerald-600 flex-shrink-0" />
                          )}
                          {displayValue}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Features side-by-side */}
      <div>
        <div className="sticky top-0 z-[5] px-3 py-2 bg-gray-100 border-b text-xs font-semibold text-muted-foreground">
          Features
        </div>
        <div className="divide-y">
          {(() => {
            const allFeatures = new Set();
            cars.forEach((car) =>
              (car.features || []).forEach((f) => allFeatures.add(f))
            );
            const features = Array.from(allFeatures).sort();

            if (features.length === 0) {
              return (
                <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                  No features listed
                </div>
              );
            }

            return features.map((feature) => {
              const carHas = cars.map((car) =>
                (car.features || []).includes(feature)
              );
              const isDifferent = carHas.some((v) => v !== carHas[0]);
              const showHighlight = highlightDifferences && isDifferent;

              return (
                <div
                  key={feature}
                  className={cn(
                    "transition-colors duration-200",
                    showHighlight && "bg-amber-50/60"
                  )}
                >
                  <div
                    className={cn(
                      "px-3 pt-2 pb-0.5 text-[10px] text-muted-foreground line-clamp-1",
                      showHighlight && "border-l-2 border-l-amber-400"
                    )}
                  >
                    {feature}
                  </div>
                  <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                    {cars.map((car) => {
                      const has = (car.features || []).includes(feature);
                      return (
                        <div key={car.id} className="flex items-center gap-1">
                          {has ? (
                            <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center">
                              <Minus className="h-2.5 w-2.5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default MobileCompareTable;
