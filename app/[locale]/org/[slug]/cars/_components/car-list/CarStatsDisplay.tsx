"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import type { CarsListPresenterProps } from "./CarsListPresenter";

const CarStatsDisplay = ({
  stats,
  isRefreshing,
  isLoading,
  onRefresh,
}: {
  stats: CarsListPresenterProps["carStats"];
  isRefreshing: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}) => {
  const t = useTranslations("org.cars.stats");
  const { number } = useFormatters();

  // Counts are formatted before they reach the message — a raw numeric ICU
  // argument renders Western digits on an otherwise Eastern-numeral page.
  // See lib/utils/intl-locale.
  const counts = [
    {
      key: "available",
      label: t("available", { count: number(stats.availableCount) }),
      className: "text-green-600 bg-green-50",
    },
    {
      key: "sold",
      label: t("sold", { count: number(stats.soldCount) }),
      className: "text-red-600 bg-red-50",
    },
    {
      key: "unavailable",
      label: t("unavailable", { count: number(stats.unavailableCount) }),
      className: "text-gray-600 bg-gray-50",
    },
    {
      key: "featured",
      label: t("featured", { count: number(stats.featuredCount) }),
      className: "text-yellow-600 bg-yellow-50",
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <CardTitle className="text-lg sm:text-xl text-gray-900 flex items-center gap-2">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-gray-600 space-y-2">
          <div className="flex flex-wrap gap-2 sm:gap-3 text-sm">
            {counts.map((count) => (
              <span
                key={count.key}
                className={`font-medium px-2 py-1 rounded-md ${count.className}`}
              >
                {count.label}
              </span>
            ))}
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
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="sm:inline">{t("refresh")}</span>
        </Button>
      </div>
    </div>
  );
};

export default CarStatsDisplay;
