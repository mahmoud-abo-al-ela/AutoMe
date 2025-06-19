import React from "react";
import { Shield, Mail, MoreHorizontal, Loader2 } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserTableRow = ({
  user,
  onToggleRole,
  onDeleteUser,
  loadingUpdateRole,
  loadingDeleteUser,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <TableRow className="border-b">
      <TableCell className="py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <div className="bg-primary/10 p-1 sm:p-1.5 md:p-2 rounded-full flex-shrink-0">
            <Shield className="h-5 w-5  text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-xs sm:text-sm md:text-base truncate">
              {user.name || "No Name"}
            </div>
            <div className="text-[10px] text-sm sm:text-base text-gray-500 flex items-center gap-0.5 sm:gap-1">
              <Mail className=" h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[120px] md:max-w-none">
                {user.email}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:hidden">
              <Badge
                variant={user.role === "ADMIN" ? "default" : "secondary"}
                className="text-[8px] sm:text-xs py-0 h-4 sm:h-5 px-1.5"
              >
                {user.role}
              </Badge>
              <span className="text-[11px] sm:text-base text-gray-500">
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4">
        <Badge
          variant={user.role === "ADMIN" ? "default" : "secondary"}
          className="text-xs md:text-sm"
        >
          {user.role}
        </Badge>
      </TableCell>
      <TableCell className="text-xs md:text-sm text-gray-500 hidden sm:table-cell py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="text-right sm:text-left py-1.5 sm:py-2 md:py-3 px-1 sm:px-3 md:px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={loadingUpdateRole || loadingDeleteUser}
              className="cursor-pointer p-0 rounded-full mx-auto w-full"
            >
              {loadingUpdateRole || loadingDeleteUser ? (
                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="text-xs sm:text-sm w-32 sm:w-36"
          >
            <DropdownMenuItem
              onClick={() => onToggleRole(user.id, user.role)}
              className="cursor-pointer py-1.5 sm:py-2"
            >
              {user.role === "ADMIN" ? "Make User" : "Make Admin"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteUser(user)}
              className="text-red-600 cursor-pointer py-1.5 sm:py-2"
            >
              Remove User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
