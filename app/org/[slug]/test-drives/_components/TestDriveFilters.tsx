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
import { Search, X, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export const TestDriveFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  onFilterChange,
  disabled,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  onFilterChange: (value: string) => void;
  disabled: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);

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
                className={`absolute left-3 top-2.5 h-4 w-4 ${
                  isFocused ? "text-blue-500" : "text-gray-400"
                } transition-colors`}
              />
              <Input
                placeholder="Search by car model or customer name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 sm:pl-10 text-sm h-9 sm:h-10 bg-gray-50 border-gray-200 ${
                  isFocused
                    ? "ring-1 sm:ring-2 ring-blue-100 border-blue-300"
                    : "focus:bg-white"
                } transition-all`}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
                aria-label="Search test drives"
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

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:items-center">
              <Select
                value={statusFilter}
                onValueChange={onFilterChange}
                disabled={disabled}
              >
                <SelectTrigger
                  className={`w-full sm:w-[180px] h-9 sm:h-10 text-sm bg-gray-50 border-gray-200 ${
                    statusFilter !== "all"
                      ? "border-blue-300 text-blue-700"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    <Filter
                      className={`h-4 w-4 mr-1  ${
                        statusFilter !== "all"
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                    />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  onFilterChange("all");
                }}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 h-6 sm:h-8 px-2 sm:px-3"
                disabled={disabled}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Clear filters
              </Button>
            </div>
          )}

          {/* Loading indicator */}
          {disabled && (
            <div className="flex items-center justify-center py-1">
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-gray-400" />
              <span className="ml-2 text-xs sm:text-sm text-gray-500">
                Loading...
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
