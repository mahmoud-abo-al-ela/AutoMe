import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
    <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mb-3 sm:mb-4" />
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
      Failed to load cars
    </h3>
    <p className="text-sm sm:text-base text-gray-500 mb-4 max-w-md">
      {error || "An error occurred while loading the car inventory."}
    </p>
    <Button onClick={onRetry} className="mb-2 text-sm">
      <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
      Try again
    </Button>
  </div>
);

export default ErrorState;
