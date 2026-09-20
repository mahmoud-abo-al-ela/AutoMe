import React from "react";
import { useTranslations } from "next-intl";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CarTableHeader = () => {
  const t = useTranslations("org.cars.table");

  return (
    <TableHeader>
      <TableRow className="bg-gray-50/50">
        <TableHead className="font-semibold text-gray-900 px-3 md:px-4 py-3">
          {t("vehicle")}
        </TableHead>
        <TableHead className="font-semibold text-gray-900 py-3 hidden md:table-cell">
          {t("pricing")}
        </TableHead>
        <TableHead className="font-semibold text-gray-900 py-3 hidden md:table-cell">
          {t("status")}
        </TableHead>
        <TableHead className="font-semibold text-gray-900 py-3 hidden md:table-cell">
          {t("featured")}
        </TableHead>
        <TableHead className="font-semibold text-gray-900 text-center py-3">
          {t("actions")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default CarTableHeader;
