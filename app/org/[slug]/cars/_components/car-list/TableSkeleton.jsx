import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const TableSkeleton = () => (
  <>
    {[1, 2, 3, 4].map((i) => (
      <TableRow key={i} className="animate-pulse">
        <TableCell>
          <div className="flex items-center gap-2 md:gap-4">
            <Skeleton className="hidden sm:block w-16 h-12 md:w-20 md:h-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 sm:w-40" />
              <Skeleton className="h-3 w-24 sm:w-32" />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 md:h-6 w-16 md:w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 md:h-6 w-16 md:w-24" />
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <Skeleton className="h-5 md:h-6 w-16 md:w-24" />
        </TableCell>
        <TableCell className="text-center">
          <Skeleton className="h-8 w-8 rounded-full mx-auto" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

export default TableSkeleton;
