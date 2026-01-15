"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  UserCog,
  Pause,
  Play,
  Trash2,
  Loader2,
} from "lucide-react";

export default function OrganizationActions({
  org,
  onToggleStatus,
  onImpersonate,
  onDelete,
  actionLoading,
  isPending,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/super-admin/organizations/${org.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onImpersonate(org)}>
          <UserCog className="h-4 w-4 mr-2" />
          Impersonate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onToggleStatus(org)}
          disabled={actionLoading === `status-${org.id}` || isPending}
        >
          {actionLoading === `status-${org.id}` ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {org.isActive ? "Suspending..." : "Activating..."}
            </>
          ) : org.isActive ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Suspend
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Activate
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(org)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
