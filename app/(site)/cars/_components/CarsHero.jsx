"use client";

import { Flame } from "lucide-react";
import { AiSearchBar } from "./AiSearchBar";

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
  onAskAi,
  aiLoading,
  aiError,
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

        {/* Search — plain text by default, with an explicit "Ask AI" affordance */}
        <AiSearchBar
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onClearSearch}
          onAskAi={onAskAi}
          loading={aiLoading}
          error={aiError}
        />

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
