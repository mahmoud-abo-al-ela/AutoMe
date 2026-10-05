"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";

import type { UsersPagination as UsersPaginationState } from "./UsersTable";

export default function UsersPagination({
  pagination,
  onPageChange,
}: {
  pagination: UsersPaginationState;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("superAdmin");
  const { number } = useFormatters();

  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {t("users.pagination", {
          from: number((pagination.page - 1) * pagination.limit + 1),
          to: number(Math.min(pagination.page * pagination.limit, pagination.total)),
          total: number(pagination.total),
        })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t("common.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          {t("common.next")}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
