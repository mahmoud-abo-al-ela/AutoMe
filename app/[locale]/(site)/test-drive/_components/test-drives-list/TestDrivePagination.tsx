"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import type { TestDrivePagination as Pagination } from "../../_lib/test-drive-types";

const TestDrivePagination = ({
    pagination,
    onPageChange,
}: {
    pagination: Pagination | null;
    onPageChange: (page: number) => void;
}) => {
    if (!pagination || pagination.totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex justify-center mt-6 sm:mt-8 gap-1 sm:gap-2">
            <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => onPageChange(Math.max(pagination.page - 1, 1))}
                className="cursor-pointer text-xs sm:text-sm px-2 sm:px-3"
            >
                Previous
            </Button>
            <div className="flex items-center gap-1 sm:gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(
                        (p) =>
                            p === 1 ||
                            p === pagination.totalPages ||
                            (p >= pagination.page - 1 && p <= pagination.page + 1)
                    )
                    .map((p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) {
                            return (
                                <React.Fragment key={`ellipsis-${p}`}>
                                    <span className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
                                        ...
                                    </span>
                                    <Button
                                        key={p}
                                        variant={pagination.page === p ? "default" : "outline"}
                                        size="icon"
                                        className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer text-xs sm:text-sm"
                                        onClick={() => onPageChange(p)}
                                    >
                                        {p}
                                    </Button>
                                </React.Fragment>
                            );
                        }
                        return (
                            <Button
                                key={p}
                                variant={pagination.page === p ? "default" : "outline"}
                                size="icon"
                                className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer text-xs sm:text-sm"
                                onClick={() => onPageChange(p)}
                            >
                                {p}
                            </Button>
                        );
                    })}
            </div>
            <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="cursor-pointer text-xs sm:text-sm px-2 sm:px-3"
            >
                Next
            </Button>
        </div>
    );
};

export default TestDrivePagination;