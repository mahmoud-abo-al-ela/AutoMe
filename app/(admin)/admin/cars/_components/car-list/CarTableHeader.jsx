import React from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CarTableHeader = () => (
  <TableHeader>
    <TableRow className="bg-gray-50/50">
      <TableHead className="font-semibold text-gray-900 px-2 md:px-4 py-3">
        Vehicle
      </TableHead>
      <TableHead className="font-semibold text-gray-900 py-3 hidden md:table-cell">
        Pricing
      </TableHead>
      <TableHead className="font-semibold text-gray-900 py-3 hidden md:table-cell">
        Status
      </TableHead>
      <TableHead className="font-semibold text-gray-900 py-3 hidden md:table-cell">
        Featured
      </TableHead>
      <TableHead className="font-semibold text-gray-900 text-center py-3">
        Actions
      </TableHead>
    </TableRow>
  </TableHeader>
);

export default CarTableHeader;
