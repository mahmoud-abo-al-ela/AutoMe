import { Search, X, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const CarsHero = ({
    searchQuery,
    onSearchChange,
    onClearSearch,
    totalCount,
    onQuickSearch
}) => {
    const popularSearches = ["SUV", "Electric", "Under $30k", "Luxury"];

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 animated-gradient px-6 py-12 sm:px-10 sm:py-16 mb-8 shadow-xl">
            {/* Decorative animated background elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blue-400/20 blur-[80px] animate-float" />
                <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-400/20 blur-[100px] animate-float-delayed" />
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float" />
                <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl animate-float-delayed" />
            </div>

            <div className="relative mx-auto max-w-2xl text-center z-10">
                {/* Title */}
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-sm">
                    Find Your Perfect Car
                </h1>

                {/* Subtitle */}
                <p className="mt-4 text-base text-white/80 sm:text-lg max-w-xl mx-auto font-medium">
                    Explore{" "}
                    {totalCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 mx-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold shadow-sm">
                            {totalCount.toLocaleString()}
                        </span>
                    )}{" "}
                    {totalCount === 1 ? "vehicle" : "vehicles"} from trusted premium dealerships
                </p>

                {/* Integrated Search Bar with Glassmorphism */}
                <div className="mt-8 relative max-w-xl mx-auto group">
                    <div className="absolute inset-0 bg-white/20 rounded-xl blur-md group-focus-within:bg-white/30 transition-all duration-300"></div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 z-10" />
                        <Input
                            type="text"
                            placeholder="Search cars, models, or keywords..."
                            value={searchQuery || ""}
                            onChange={onSearchChange}
                            className="h-14 w-full rounded-xl border border-white/40 bg-white/90 backdrop-blur-lg pl-12 pr-12 text-base text-gray-900 shadow-lg placeholder:text-gray-500 focus-visible:ring-4 focus-visible:ring-white/20 focus-visible:border-white transition-all duration-300"
                        />
                        {searchQuery && (
                            <button
                                onClick={onClearSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 z-10"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Pick Chips */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <div className="flex items-center text-white/70 text-sm font-medium mr-2">
                        <Flame className="w-4 h-4 mr-1 text-orange-300" />
                        Popular:
                    </div>
                    {popularSearches.map((term) => (
                        <Badge
                            key={term}
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 py-1 px-3 text-sm font-normal"
                            onClick={() => onQuickSearch(term)}
                        >
                            {term}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CarsHero;
