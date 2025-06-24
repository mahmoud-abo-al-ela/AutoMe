import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isLoading,
}) => {
  return (
    <form onSubmit={handleSearch} className="mb-3 sm:mb-4">
      <div className="relative">
        <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search cars, models, or keywords..."
          className="pl-8 sm:pl-10 py-1.5 sm:py-2 h-9 sm:h-10 text-xs sm:text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading}
        />
      </div>
    </form>
  );
};

export default SearchBar;
