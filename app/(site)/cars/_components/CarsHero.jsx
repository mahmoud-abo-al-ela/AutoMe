"use client";

import { Search, X, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";

// Structured quick-picks map to real filters, not free-text search — so
// "Under $30k" and "Luxury" actually return matching cars.
const QUICK_PICKS = [
  { label: "SUV", patch: { bodyType: ["SUV"] } },
  { label: "Electric", patch: { fuelType: ["Electric"] } },
  { label: "Under $30k", patch: { maxPrice: 30000 } },
  { label: "Luxury", patch: { minPrice: 60000 } },
];

export const CarsHero = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  totalCount,
  onQuickPick,
}) => {
  return (
    <div className="animated-gradient relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-brand-accent px-6 py-8 shadow-lg sm:px-10 sm:py-10">
      {/* Decorative floating accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="animate-float-delayed absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-4xl">
          Find Your Perfect Car
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-white/80 sm:text-base">
          Browse {totalCount > 0 ? totalCount.toLocaleString() : ""} {totalCount === 1 ? "vehicle" : "vehicles"} from trusted dealerships
        </p>

        {/* Search */}
        <div className="group relative mx-auto mt-6 max-w-xl">
          <Search className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search cars, models, or keywords..."
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-14 w-full rounded-xl border border-white/40 bg-white/95 pl-12 pr-12 text-base text-gray-900 shadow-lg placeholder:text-gray-500 focus-visible:border-white focus-visible:ring-4 focus-visible:ring-white/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick picks */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 flex items-center text-sm font-medium text-white/70">
            <Flame className="mr-1 h-4 w-4 text-orange-300" />
            Popular:
          </span>
          {QUICK_PICKS.map(({ label, patch }) => (
            <button
              key={label}
              type="button"
              onClick={() => onQuickPick(patch)}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-normal text-white backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarsHero;
