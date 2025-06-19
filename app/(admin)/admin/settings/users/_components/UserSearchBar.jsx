import React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const UserSearchBar = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching,
}) => {
  return (
    <div className="flex items-center gap-2 mt-2 sm:mt-4">
      <div className="relative w-full">
        <Search className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
        <Input
          placeholder="Search by name or email..."
          className="pl-7 sm:pl-8 pr-8 sm:pr-10 h-8 sm:h-10 text-xs sm:text-sm"
          value={searchQuery}
          onChange={onSearchChange}
        />
        {searchQuery && (
          <button
            className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={onClearSearch}
            aria-label="Clear search"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        )}
      </div>
      {isSearching && (
        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-gray-500" />
      )}
    </div>
  );
};

export default UserSearchBar;
