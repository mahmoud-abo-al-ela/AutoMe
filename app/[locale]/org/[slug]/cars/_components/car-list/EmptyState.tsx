"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { EmptyState as SharedEmptyState } from "@/components/common/EmptyState";
import { Car } from "lucide-react";

const EmptyState = ({
  searchTerm,
  statusFilter,
  onClearFilters,
}: {
  searchTerm: string;
  statusFilter: string;
  onClearFilters: () => void;
}) => {
  const t = useTranslations("org.cars.empty");
  const isFiltered = searchTerm || statusFilter !== "all";

  return (
    <SharedEmptyState
      variant={isFiltered ? "filtered" : "inline"}
      icon={Car}
      title={t("title")}
      description={isFiltered ? t("filtered") : t("body")}
      onClearFilters={isFiltered ? onClearFilters : undefined}
    />
  );
};

export default EmptyState;
