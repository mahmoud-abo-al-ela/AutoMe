import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const DealershipsSearchBar = ({ searchQuery, onSearchChange, onClearSearch }) => {
    return (
        <div className="mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Search dealerships by name, location, or description..."
                    value={searchQuery}
                    onChange={onSearchChange}
                    className="pl-10 pr-10 h-12"
                />
                {searchQuery && (
                    <button
                        onClick={onClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};
