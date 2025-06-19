import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const UserPagination = ({
  page,
  limit,
  total,
  onPageChange,
  isLoading,
  isSearching,
}) => {
  if (!total || total <= limit) return null;

  const totalPages = Math.ceil(total / limit);
  const showingStart = Math.min((page - 1) * limit + 1, total);
  const showingEnd = Math.min(page * limit, total);

  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-2 sm:gap-4">
      <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left w-full sm:w-auto mt-2 sm:mt-0">
        <span className="hidden xs:inline">Showing </span>
        {showingStart}-{showingEnd} <span className="hidden xs:inline">of</span>{" "}
        <span className="font-medium">{total}</span>
      </div>
      <div className="flex items-center justify-center w-full sm:w-auto order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1 || isLoading || isSearching}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <div className="text-xs sm:text-sm mx-2 sm:mx-3 min-w-[3rem] text-center">
          <span className="hidden xs:inline">Page </span>
          {page} <span className="hidden xs:inline">of {totalPages}</span>
          <span className="inline xs:hidden">/{totalPages}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages || isLoading || isSearching}
          onClick={() => onPageChange(page + 1)}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
          aria-label="Next page"
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
};

export default UserPagination;
