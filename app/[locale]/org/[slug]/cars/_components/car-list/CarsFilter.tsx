"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter, X, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const CarsFilter = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  disabled,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  disabled: boolean;
}) => {
  const router = useRouter();
  const { slug } = useParams();
  const [isFocused, setIsFocused] = useState(false);


  // Wired to the form's onSubmit; it exists only to stop the default navigation
  // since filtering happens as you type.
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all";

  return (
    <Card className="mb-3 sm:mb-6 shadow-md border-0 bg-white p-1 sm:p-2">
      <CardContent className="p-1 sm:p-2">
        <div className="flex flex-col gap-2 sm:gap-4">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
            <form onSubmit={handleSearch} className="relative flex-1 w-full">
              <Search
                className={`absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 ${isFocused ? "text-blue-500" : "text-gray-400"
                  } transition-colors`}
              />
              <Input
                placeholder="Search by model or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 sm:pl-10 text-sm h-9 sm:h-10 bg-gray-50 border-gray-200 ${isFocused
                  ? "ring-1 sm:ring-2 ring-blue-100 border-blue-300"
                  : "focus:bg-white"
                  } transition-all`}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
                aria-label="Search cars"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 sm:right-3 top-2.5 sm:top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={disabled}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              )}
              {disabled && (
                <div className="absolute right-2 sm:right-3 top-2.5 sm:top-3">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-blue-500" />
                </div>
              )}
            </form>

            <div className="flex gap-2 items-center">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                disabled={disabled}
              >
                <SelectTrigger
                  className={`w-full sm:w-[180px] h-9 sm:h-10 text-sm bg-gray-50 border-gray-200 ${statusFilter !== "all"
                    ? "border-blue-300 text-blue-700"
                    : ""
                    }`}
                >
                  <div className="flex items-center">
                    <Filter
                      className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${statusFilter !== "all"
                        ? "text-blue-500"
                        : "text-gray-400"
                        }`}
                    />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="text-xs sm:text-sm">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  disabled={disabled}
                  className="text-gray-500 hover:text-gray-700 text-sm h-9 sm:h-10 px-3"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white cursor-pointer text-sm h-9 sm:h-10 px-3 sm:px-4 w-auto"
              onClick={() => router.push(`/org/${slug}/cars/create`)}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Add Car
            </Button>

          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarsFilter;
