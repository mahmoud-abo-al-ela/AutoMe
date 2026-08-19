"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Scale,
  ArrowRight,
  Car,
  Plus,
  ChevronRight,
  Search,
} from "lucide-react";
import CompareCarCard from "./CompareCarCard";
import { handleRemoveCar } from "./utils";
import type { CompareCar } from "../_lib/compare-types";

/**
 * Empty state for the compare page.
 *
 * Two modes:
 *  1. **No cars** – Modern illustration with Lucide icons, animated entrance,
 *     and a gradient CTA button linking to /cars.
 *  2. **Single car** – Shows the car card prominently on the left with an
 *     animated arrow pointing to an "Add another car" CTA on the right.
 *
 * Uses shared `handleRemoveCar` from utils instead of duplicated logic.
 */
const EmptyCompare = ({ singleCar }: { singleCar: CompareCar | null }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      {singleCar ? (
        <SingleCarState car={singleCar} />
      ) : (
        <NoCarsState />
      )}
    </motion.div>
  );
};

// ─── Single Car State ────────────────────────────────────────────────────────

const SingleCarState = ({ car }: { car: CompareCar }) => {
  return (
    <div className="flex flex-col md:flex-row">
      {/* Car card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full md:w-[320px] lg:w-[360px] p-4 sm:p-5 md:border-e border-b md:border-b-0"
      >
        <CompareCarCard car={car} onRemove={handleRemoveCar} />
      </motion.div>

      {/* Arrow + CTA */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 text-center"
      >
        {/* Animated bouncing arrow.
            A directional icon cluster, so it is mirrored as a unit rather than
            rewritten to logical properties: the chevrons point "onward" and the
            animation nudges them the same way. Flipping the container reverses
            the glyphs, their overlap and the motion together — converting the
            -ml-4 overlap to -ms-4 would have reversed only the spacing and left
            three chevrons pointing back the way the reader came. */}
        <motion.div
          animate={{ x: [0, 8, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="hidden md:flex items-center text-primary/40 mb-6 rtl:-scale-x-100"
        >
          <ChevronRight className="h-8 w-8" />
          <ChevronRight className="h-8 w-8 -ml-4" />
          <ChevronRight className="h-8 w-8 -ml-4" />
        </motion.div>

        {/* Mobile: down arrow indicator */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="md:hidden mb-4"
        >
          <Plus className="h-8 w-8 text-primary/40" />
        </motion.div>

        <div className="bg-primary/5 p-3 rounded-full mb-4">
          <Scale className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          Add Another Car to Compare
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-sm mb-6">
          You need at least 2 cars to start comparing. Browse our
          inventory and add another car to see them side by side.
        </p>

        <Button
          asChild
          className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          <Link href="/cars">
            <Search className="me-2 h-4 w-4" />
            Browse Cars
            <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

// ─── No Cars State ───────────────────────────────────────────────────────────

const NoCarsState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-6 text-center">
      {/* Illustration: composed Lucide icons */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="relative mb-6"
      >
        {/* Background circle */}
        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-primary/10 to-blue-100 flex items-center justify-center">
          <Scale className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
        </div>

        {/* Floating car icons */}
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-2 -start-3 bg-white rounded-full p-1.5 shadow-md border"
        >
          <Car className="h-4 w-4 text-primary/70" />
        </motion.div>
        <motion.div
          animate={{ y: [2, -2, 2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute -top-1 -end-3 bg-white rounded-full p-1.5 shadow-md border"
        >
          <Car className="h-4 w-4 text-blue-500/70" />
        </motion.div>
        <motion.div
          animate={{ y: [-1, 3, -1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-2 end-0 bg-white rounded-full p-1.5 shadow-md border"
        >
          <Plus className="h-3.5 w-3.5 text-emerald-500" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          No Cars to Compare
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8">
          Start by browsing our inventory and adding cars to your
          comparison list. You can compare up to 3 cars side by side.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          <Link href="/cars">
            <Search className="me-2 h-4 w-4" />
            Browse Cars
            <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default EmptyCompare;
