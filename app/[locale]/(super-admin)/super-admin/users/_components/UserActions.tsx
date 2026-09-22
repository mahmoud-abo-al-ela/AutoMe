"use client";

import { useRouter } from "@/i18n/navigation";
import { MoreHorizontal, UserCog, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SuperAdminUserRow } from "./UsersTable";

export default function UserActions({
  user,
  onChangeRole,
}: {
  user: SuperAdminUserRow;
  onChangeRole: (user: SuperAdminUserRow) => void;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onChangeRole(user)}>
          <UserCog className="h-4 w-4 me-2" />
          Change Role
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/super-admin/users/${user.id}`)}
        >
          <User className="h-4 w-4 me-2" />
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
