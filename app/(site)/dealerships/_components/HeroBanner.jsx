import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const numberFormatter = new Intl.NumberFormat("en-US");

export const HeroBanner = ({ searchQuery, onSearchChange, onClearSearch, stats }) => {
    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 px-6 py-12 sm:px-10 sm:py-16 mb-8">
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-400/20 blur-2xl" />
            </div>

            <div className="relative mx-auto max-w-2xl text-center">
                {/* Title */}
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                    Browse Dealerships
                </h1>

                {/* Subtitle */}
                <p className="mt-3 text-sm text-blue-100 sm:text-base">
                    Find the perfect dealership for your next vehicle purchase
                </p>

                {stats && (
                    <div className="mt-5 flex items-center justify-center gap-4 text-blue-100 sm:gap-6">
                        <div className="text-center">
                            <span className="block text-xl font-bold text-white sm:text-2xl">
                                {numberFormatter.format(stats.totalDealerships)}
                            </span>
                            <span className="text-xs">Dealerships</span>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div className="text-center">
                            <span className="block text-xl font-bold text-white sm:text-2xl">
                                {numberFormatter.format(stats.totalCars)}
                            </span>
                            <span className="text-xs">Cars Available</span>
                        </div>
                        {stats.totalCities > 0 && (
                            <>
                                <div className="h-8 w-px bg-white/20" />
                                <div className="text-center">
                                    <span className="block text-xl font-bold text-white sm:text-2xl">
                                        {numberFormatter.format(stats.totalCities)}
                                    </span>
                                    <span className="text-xs">Cities</span>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Integrated Search Bar */}
                <div className="mt-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search by name, location, or description..."
                        value={searchQuery}
                        onChange={onSearchChange}
                        className="h-12 w-full rounded-lg border-0 bg-white pl-12 pr-12 text-sm shadow-lg placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/50 sm:text-base"
                    />
                    {searchQuery && (
                        <button
                            onClick={onClearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Clear search"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroBanner;
