"use client";

import CarCard from "@/components/CarCard";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationInfo } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingGrid } from "@/components/common/LoadingStates";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import type { useWishlistPage } from "@/hooks/use-wishlist-page";

export const WishlistPresenter = ({
    cars,
    pagination,
    loading,
    error,
    handlers,
}: ReturnType<typeof useWishlistPage>) => {
    const t = useTranslations("wishlist");
    const tCount = useTranslations("common.pagination.nouns");
    const tActions = useTranslations("common.actions");
    const fmt = useFormatters();
    const isEmpty = !cars || cars.length === 0;

    return (
        <div className="container py-20 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Heart className="h-7 w-7 text-primary" />
                        <h1 className="text-xl sm:text-3xl font-bold">{t("title")}</h1>
                        {!loading && !isEmpty && pagination && (
                            <Badge variant="outline" className="ms-2 bg-primary/5">
                                {/* The count is formatted separately and the noun
                                    pluralised inside its own message: the ternary
                                    encoded English two-form plural, and Arabic has
                                    six categories. */}
                                {fmt.number(pagination.total)}{" "}
                                {tCount("cars", { count: pagination.total })}
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t("subtitle")}
                    </p>
                </div>
            </div>

            {loading && <LoadingGrid count={6} />}

            {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        {t("loadError")}
                    </h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button
                        onClick={handlers.retry}
                        variant="outline"
                        className="bg-white cursor-pointer"
                    >
                        {tActions("retry")}
                    </Button>
                </div>
            )}

            {!loading && !error && isEmpty && (
                <EmptyState
                    icon={Heart}
                    title={t("emptyTitle")}
                    description={t("emptyBody")}
                    actionLabel={t("browseCars")}
                    actionHref="/cars"
                />
            )}

            {!loading && !error && !isEmpty && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {cars.map((car) => (
                            <CarCard
                                key={car.id}
                                car={car}
                                onWishlistChange={handlers.handleWishlistChange}
                            />
                        ))}
                    </div>

                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={handlers.handlePageChange}
                        disabled={loading}
                    />

                    <PaginationInfo
                        currentPage={pagination.page}
                        limit={pagination.limit}
                        total={pagination.total}
                    />
                </>
            )}
        </div>
    );
};
