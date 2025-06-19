import React from "react";
import { Users } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const UserTableEmpty = ({ searchQuery, clearSearch }) => {
  return (
    <TableRow>
      <TableCell colSpan={5} className="p-0">
        <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-2 sm:space-y-3 px-4">
          <div className="p-2 sm:p-3 rounded-full bg-gray-100">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-500" />
          </div>
          <div className="text-center">
            <p className="font-medium text-sm sm:text-base">
              {searchQuery
                ? "No users found matching your search"
                : "No users found"}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {searchQuery ? (
                <>
                  Try adjusting your search or{" "}
                  <Button
                    variant="link"
                    className="text-primary underline cursor-pointer p-0 h-auto text-xs sm:text-sm"
                    onClick={clearSearch}
                  >
                    clear the search
                  </Button>
                </>
              ) : (
                "Users added to the system will appear here"
              )}
            </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserTableEmpty;
