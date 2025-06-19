import React from "react";
import { X } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const UserTableError = ({ error, onRetry }) => {
  return (
    <TableRow>
      <TableCell colSpan={5} className="p-0">
        <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-2 sm:space-y-3 px-4">
          <div className="p-2 sm:p-3 rounded-full bg-red-100">
            <X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
          </div>
          <div className="text-center">
            <p className="font-medium text-sm sm:text-base">
              Error loading users
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {error?.message || "Please try again later"}
            </p>
          </div>
          <Button
            onClick={onRetry}
            size="sm"
            className="mt-2 text-xs sm:text-sm h-8 sm:h-9"
          >
            Try Again
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserTableError;
