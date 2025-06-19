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
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CarsFilter = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  disabled,
  isMobileView,
}) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e) => {
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
                className={`absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 ${
                  isFocused ? "text-blue-500" : "text-gray-400"
                } transition-colors`}
              />
              <Input
                placeholder="Search by model or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-7 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10 bg-gray-50 border-gray-200 ${
                  isFocused
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
                  className={`w-full sm:w-[180px] h-8 sm:h-10 text-xs sm:text-sm bg-gray-50 border-gray-200 ${
                    statusFilter !== "all"
                      ? "border-blue-300 text-blue-700"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    <Filter
                      className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${
                        statusFilter !== "all"
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
                  className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm h-8 sm:h-10 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active filters and add button */}
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex-grow">
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 border border-blue-200 text-xs py-0.5 px-1.5"
                >
                  {statusFilter !== "all" && (
                    <span className="mr-1 capitalize">{statusFilter}</span>
                  )}
                  {searchTerm && statusFilter !== "all" && " • "}
                  {searchTerm && <span>"{searchTerm}"</span>}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white cursor-pointer text-xs sm:text-sm h-8 sm:h-10 py-0 px-2 sm:px-4 w-auto"
              onClick={() => router.push("/admin/cars/create")}
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
