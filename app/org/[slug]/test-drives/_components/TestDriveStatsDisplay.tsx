import React from "react";
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import type { TestDrivesPresenterProps } from "./TestDrivesPresenter";

export const TestDriveStatsDisplay = ({
  stats,
  isRefreshing,
  isLoading,
  onRefresh,
}: {
  stats: TestDrivesPresenterProps["testDriveStats"];
  isRefreshing: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="space-y-2">
      <CardTitle className="text-lg sm:text-xl text-gray-900 flex items-center gap-2">
        Test Drive Requests
      </CardTitle>
      <CardDescription className="text-gray-600 space-y-2">
        <div className="flex flex-wrap gap-2 sm:gap-3 text-sm">
            <span className="text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-md">
            {stats.pendingCount} pending
          </span>
          <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
            {stats.confirmedCount} confirmed
          </span>
          <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded-md">
            {stats.cancelledCount} cancelled
          </span>
           <span className="text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-md">
            {stats.count} total
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
        className="flex items-center gap-2 h-9 px-4 w-full sm:w-auto cursor-pointer"
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
        />
        <span className="sm:inline">Refresh</span>
      </Button>
    </div>
  </div>
);
