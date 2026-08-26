"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
};

export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    disabled = false
}: PaginationProps) => {
    const t = useTranslations("common.pagination");

    const getPageNumbers = () => {
        const pageNumbers: number[] = [];

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
        <nav className="flex justify-center mt-6 sm:mt-8" aria-label={t("label")}>
            <div className="flex items-center gap-1 sm:gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || disabled}
                    className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10"
                    aria-label={t("previous")}
                >
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
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
                            aria-label={t("page", { number: pageNum })}
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
                    aria-label={t("next")}
                >
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
            </div>
        </nav>
    );
};

type PaginationInfoProps = {
    currentPage: number;
    limit: number;
    total?: number | null;
    /** Key under `common.pagination.nouns`, not a display word. */
    noun?: "items" | "cars" | "dealerships";
};

export const PaginationInfo = ({
    currentPage,
    limit,
    total,
    noun = "items",
}: PaginationInfoProps) => {
    const t = useTranslations("common.pagination");

    if (!total) return null;

    const start = Math.min((currentPage - 1) * limit + 1, total);
    const end = Math.min(currentPage * limit, total);

    return (
        <div className="text-center text-sm text-muted-foreground mt-4">
            {t("showing", {
                start,
                end,
                total,
                // The noun is pluralised inside its own message rather than by
                // the caller. A caller doing `total === 1 ? "dealership" :
                // "dealerships"` encodes English's two-form plural; Arabic has
                // six, so that choice cannot be made outside the message.
                noun: t(`nouns.${noun}`, { count: total }),
            })}
        </div>
    );
};
