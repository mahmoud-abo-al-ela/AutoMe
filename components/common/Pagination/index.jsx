"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    disabled = false
}) => {
    const getPageNumbers = () => {
        const pageNumbers = [];

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else if (currentPage <= 3) {
            for (let i = 1; i <= 5; i++) {
                pageNumbers.push(i);
            }
        } else if (currentPage >= totalPages - 2) {
            for (let i = totalPages - 4; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                pageNumbers.push(i);
            }
        }

        return pageNumbers;
    };

    if (totalPages <= 1) return null;

    return (
        <nav className="flex justify-center mt-6 sm:mt-8" aria-label="Pagination">
            <div className="flex items-center gap-1 sm:gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || disabled}
                    className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto px-1">
                    {getPageNumbers().map((pageNum) => (
                        <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(pageNum)}
                            disabled={disabled}
                            className="w-8 h-8 sm:w-10 sm:h-10 cursor-pointer"
                            aria-label={`Page ${pageNum}`}
                            aria-current={currentPage === pageNum ? "page" : undefined}
                        >
                            {pageNum}
                        </Button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || disabled}
                    className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </nav>
    );
};

export const PaginationInfo = ({ currentPage, limit, total, noun = "items" }) => {
    if (!total) return null;

    const start = Math.min((currentPage - 1) * limit + 1, total);
    const end = Math.min(currentPage * limit, total);

    return (
        <div className="text-center text-sm text-muted-foreground mt-4">
            Showing {start} to {end} of {total.toLocaleString()} {noun}
        </div>
    );
};
