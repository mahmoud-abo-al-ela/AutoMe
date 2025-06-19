import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const Pagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  isDisabled,
  isMobileView,
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-between items-center py-3 px-0 sm:px-4 border-t gap-4 sm:gap-0">
      <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{" "}
        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} cars
      </div>
      <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
        {!isMobileView && (
          <Select
            value={String(pageSize)}
            onValueChange={onPageSizeChange}
            disabled={isDisabled}
            className="w-20 sm:w-28"
          >
            <SelectTrigger className="cursor-pointer h-8 text-xs">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5" className="cursor-pointer">
                5
              </SelectItem>
              <SelectItem value="10" className="cursor-pointer">
                10
              </SelectItem>
              <SelectItem value="20" className="cursor-pointer">
                20
              </SelectItem>
              <SelectItem value="50" className="cursor-pointer">
                50
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        <div
          className={`flex items-center gap-1 ${
            isMobileView ? "w-full justify-center" : ""
          }`}
        >
          {!isMobileView && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer"
              disabled={currentPage === 1 || isDisabled}
              onClick={() => onPageChange(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 p-0 cursor-pointer"
            disabled={currentPage === 1 || isDisabled}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          <div className="flex items-center gap-1 mx-1">
            {/* First page - only show in non-mobile view or if we're not near it */}
            {!isMobileView && currentPage > 3 && (
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 p-0 cursor-pointer"
                onClick={() => onPageChange(1)}
              >
                1
              </Button>
            )}

            {/* Ellipsis if needed - only in non-mobile view */}
            {!isMobileView && currentPage > 4 && (
              <div className="px-1">...</div>
            )}

            {/* Pages around current page - show fewer on mobile */}
            {Array.from(
              {
                length: isMobileView
                  ? Math.min(3, totalPages)
                  : Math.min(5, totalPages),
              },
              (_, i) => {
                let pageNum;

                if (totalPages <= (isMobileView ? 3 : 5)) {
                  // If few total pages, show all
                  pageNum = i + 1;
                } else if (currentPage <= (isMobileView ? 2 : 3)) {
                  // Near start
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - (isMobileView ? 1 : 2)) {
                  // Near end
                  pageNum = totalPages - (isMobileView ? 2 : 4) + i;
                } else {
                  // Middle - current page and siblings
                  pageNum = currentPage - (isMobileView ? 1 : 2) + i;
                }

                // Skip rendering if out of range
                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={() => onPageChange(pageNum)}
                    disabled={isDisabled}
                  >
                    {pageNum}
                  </Button>
                );
              }
            )}

            {/* Ellipsis if needed - only in non-mobile view */}
            {!isMobileView && currentPage < totalPages - 3 && (
              <div className="px-1">...</div>
            )}

            {/* Last page - only show in non-mobile view or if we're not near it */}
            {!isMobileView &&
              totalPages > 3 &&
              currentPage < totalPages - 2 && (
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 p-0 cursor-pointer"
                  onClick={() => onPageChange(totalPages)}
                  disabled={isDisabled}
                >
                  {totalPages}
                </Button>
              )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 p-0 cursor-pointer"
            disabled={currentPage === totalPages || isDisabled}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>

          {!isMobileView && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer"
              disabled={currentPage === totalPages || isDisabled}
              onClick={() => onPageChange(totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pagination;
