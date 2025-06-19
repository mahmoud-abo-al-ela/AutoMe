import React from "react";
import { Loader2 } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";

const UserTableLoading = () => {
  return (
    <TableRow>
      <TableCell colSpan={5} className="p-0">
        <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-2 sm:space-y-3">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 animate-spin text-primary" />
          <p className="text-xs sm:text-sm text-gray-500">Loading users...</p>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserTableLoading;
