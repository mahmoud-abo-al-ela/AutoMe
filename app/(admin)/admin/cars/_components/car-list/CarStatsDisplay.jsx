import React from "react";
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

const CarStatsDisplay = ({
  stats,
  isRefreshing,
  isLoading,
  onRefresh,
  isMobileView,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-2 sm:p-4">
    <div className="space-y-2">
      <CardTitle className="text-lg sm:text-xl text-gray-900 flex items-center gap-2">
        Car Inventory
      </CardTitle>
      <CardDescription className="text-gray-600 space-y-2">
        <div className="text-sm font-medium">
          {stats.count} cars found • Total value: $
          {stats.totalValue.toLocaleString()}
        </div>
        <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
          <span className="text-green-600 font-medium">
            {stats.availableCount} available
          </span>
          <span className="text-red-600 font-medium">
            {stats.soldCount} sold
          </span>
          <span className="text-gray-600 font-medium">
            {stats.unavailableCount} unavailable
          </span>
          <span className="text-yellow-600 font-medium">
            {stats.featuredCount} featured
          </span>
        </div>
      </CardDescription>
    </div>
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading || isRefreshing}
        className="flex items-center gap-2 h-10 px-4 w-full sm:w-auto"
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
        />
        Refresh
      </Button>
      <Badge
        variant="outline"
        className="text-gray-600 bg-white text-sm py-1.5 px-3 w-full sm:w-auto text-center"
      >
        {stats.count} of {stats.totalCount} cars
      </Badge>
    </div>
  </div>
);

export default CarStatsDisplay;
